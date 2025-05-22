const Project = require('../modules/project/project.model');
const { logger } = require('./logger');

/**
 * Middleware to check if the authenticated user has access to a specific project
 * Access is granted if the user is:
 * 1. The project manager
 * 2. A team member of the project
 * 3. Has Admin role
 */
exports.hasProjectAccess = async (req, res, next) => {
    try {
        const projectId = req.params.id;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Get the authenticated user from the request (set by the protect middleware)
        const userId = req.user._id;

        // Find the project
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user has Admin role
    
        const isAdmin = req.user.role === 'ERP System Administrator';

        // If user is admin, allow access
        if (isAdmin) {
            logger.info(`Admin user ${userId} granted access to project ${projectId}`);
            return next();
        }

        // Check if user is the project manager
        const isManager = project.manager && project.manager.toString() === userId.toString();

        // Check if user is a team member
        const isTeamMember = project.team && project.team.some(
            member => member.toString() === userId.toString()
        );

        // Check if user is the creator of the project
        const isCreator = project.createdBy && project.createdBy.toString() === userId.toString();

        // Grant access if user is manager, team member, or creator
        if (isManager || isTeamMember || isCreator) {
            logger.info(`User ${userId} granted access to project ${projectId} as ${isManager ? 'manager' : isTeamMember ? 'team member' : 'creator'}`);
            return next();
        }

        // If none of the conditions are met, deny access
        logger.warn(`User ${userId} denied access to project ${projectId}`);
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this project'
        });

    } catch (error) {
        logger.error(`Error in project access middleware: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}; 