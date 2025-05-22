const Project = require('./project.model');
const { validateProject } = require('./project.validation');
const Task = require('./task/task.model');

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { error } = validateProject(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = new Project({
      ...req.body,
      createdBy: req.user._id
    });

    await project.save();

    // Populate after save
    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name company')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      });

    // Transform project data
    const transformedProject = {
      ...populatedProject.toObject(),
      team: populatedProject.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.status(201).json(transformedProject);
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// // Get all projects
// exports.getProjects = async (req, res) => {
//   try {
//     const userId = req.user._id;

    

//     const isAdmin = req.user.role === 'ERP System Administrator';
   
//     const isProjectManager = req.user.role === 'Project Manager';
//     let query = {};

//     // If not admin, filter projects based on user's role
//     if (!isAdmin) {
//       if (isProjectManager) {
//         // Project managers can see projects they manage or are part of the team
//         query = {
//           $or: [
//             { manager: userId },
//             { team: userId },
//             { createdBy: userId }
//           ]
//         };
//       } else {
//         // Regular employees can only see projects they are part of
//         query = { team: userId };
//       }
//     }

//     const projects = await Project.find(query)
//       .populate('client', 'name company email phone')
//       .populate({
//         path: 'team',
//         select: 'firstName lastName email position department role status',
//         populate: [
//           {
//             path: 'position',
//             select: 'title code description'
//           },
//           {
//             path: 'department',
//             select: 'name'
//           }
//         ]
//       })
//       .populate({
//         path: 'tasks',
//         populate: [
//           {
//             path: 'assignee',
//             select: 'firstName lastName email position'
//           },
//           {
//             path: 'comments',
//             populate: {
//               path: 'author',
//               select: 'firstName lastName email'
//             }
//           },
//           {
//             path: 'attachments'
//           }
//         ]
//       })
//       .sort({ createdAt: -1 });

//     // Transform team data for all projects
//     const transformedProjects = projects.map(project => ({
//       ...project.toObject(),
//       team: project.team.map(member => ({
//         id: member._id,
//         _id: member._id,
//         name: `${member.firstName} ${member.lastName}`,
//         firstName: member.firstName,
//         lastName: member.lastName,
//         email: member.email,
//         position: member.position ? {
//           id: member.position._id,
//           title: member.position.title,
//           code: member.position.code,
//           description: member.position.description
//         } : null,
//         department: member.department ? {
//           id: member.department._id,
//           name: member.department.name
//         } : null,
//         role: member.role,
//         status: member.status
//       })),
//       tasks: project.tasks.map(task => ({
//         ...task.toObject(),
//         assignee: task.assignee ? {
//           id: task.assignee._id,
//           name: `${task.assignee.firstName} ${task.assignee.lastName}`,
//           firstName: task.assignee.firstName,
//           lastName: task.assignee.lastName,
//           email: task.assignee.email,
//           position: task.assignee.position
//         } : null,
//         comments: task.comments?.map(comment => ({
//           ...comment,
//           author: comment.author ? {
//             id: comment.author._id,
//             name: `${comment.author.firstName} ${comment.author.lastName}`,
//             email: comment.author.email
//           } : null
//         }))
//       }))
//     }));

//     res.json(transformedProjects);
//   } catch (error) {
//     console.error('Error in getProjects:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const isAdmin = req.user.role === 'ERP System Administrator';
    const isProjectManager = req.user.role === 'Project Manager';
    let query = {};

    // If not admin, filter projects based on user's role
    if (!isAdmin) {
      if (isProjectManager) {
        // Project managers can see projects they manage or are part of the team
        query = {
          $or: [
            { manager: userId },
            { team: userId },
            { createdBy: userId }
          ]
        };
      } else {
        // Regular employees can only see projects they are part of
        query = { team: userId };
      }
    }

    // Debug: Print the query being used
    console.log('Project query:', JSON.stringify(query));

    const projects = await Project.find(query)
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        populate: [
          {
            path: 'assignee',
            select: 'firstName lastName email position'
          },
          {
            path: 'comments',
            populate: {
              path: 'author',
              select: 'firstName lastName email'
            }
          },
          {
            path: 'attachments'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Debug: Log number of projects found
    console.log(`Found ${projects.length} projects`);
    
    // Debug: Check tasks on first project if available
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`First project (${firstProject._id}) tasks:`, 
        firstProject.tasks ? `${firstProject.tasks.length} tasks found` : 'No tasks array');
    }

    // Transform team data for all projects
    const transformedProjects = projects.map(project => {
      // Create project object with transformed data
      const transformedProject = {
        ...project.toObject(),
        team: project.team.map(member => ({
          id: member._id,
          _id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          position: member.position ? {
            id: member.position._id,
            title: member.position.title,
            code: member.position.code,
            description: member.position.description
          } : null,
          department: member.department ? {
            id: member.department._id,
            name: member.department.name
          } : null,
          role: member.role,
          status: member.status
        }))
      };
      
      // Handle tasks separately with proper null/undefined checks
      if (project.tasks && Array.isArray(project.tasks)) {
        transformedProject.tasks = project.tasks.map(task => {
          if (!task) return null;
          
          const transformedTask = {
            ...task.toObject(),
            assignee: task.assignee ? {
              id: task.assignee._id,
              name: `${task.assignee.firstName} ${task.assignee.lastName}`,
              firstName: task.assignee.firstName,
              lastName: task.assignee.lastName,
              email: task.assignee.email,
              position: task.assignee.position
            } : null
          };
          
          // Handle comments separately with proper null/undefined checks
          if (task.comments && Array.isArray(task.comments)) {
            transformedTask.comments = task.comments.map(comment => {
              if (!comment) return null;
              
              return {
                ...comment,
                author: comment.author ? {
                  id: comment.author._id,
                  name: `${comment.author.firstName} ${comment.author.lastName}`,
                  email: comment.author.email
                } : null
              };
            }).filter(Boolean); // Remove any null comments
          } else {
            transformedTask.comments = [];
          }
          
          return transformedTask;
        }).filter(Boolean); // Remove any null tasks
      } else {
        transformedProject.tasks = [];
      }
      
      return transformedProject;
    });

    // Debug: Log transformed project details
    console.log(`Transformed ${transformedProjects.length} projects`);
    if (transformedProjects.length > 0) {
      const firstTransformed = transformedProjects[0];
      console.log(`First transformed project tasks: ${firstTransformed.tasks ? firstTransformed.tasks.length : 'none'}`);
    }

    res.json(transformedProjects);
  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({ message: error.message });
  }
};
// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        select: 'title description status priority dueDate assignee',
        populate: {
          path: 'assignee',
          select: 'firstName lastName email'
        }
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform team data to match expected format
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in getProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { error } = validateProject(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    )
      .populate('client', 'name company')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform project data
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign team to project
exports.assignTeam = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({ message: 'Employees must be an array of IDs' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { team: employees },
      { new: true }
    )
      .populate('client', 'name company')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Transform team data to match expected format
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in assignTeam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get project details
exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company email phone')
      .populate({
        path: 'team',
        select: 'firstName lastName email position department role status',
        populate: [
          {
            path: 'position',
            select: 'title code description'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'tasks',
        select: 'title description status priority dueDate assignee comments attachments',
        populate: [
          {
            path: 'assignee',
            select: 'firstName lastName email position'
          },
          {
            path: 'comments.author',
            select: 'firstName lastName email'
          }
        ]
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Transform project data
    const transformedProject = {
      ...project.toObject(),
      team: project.team.map(member => ({
        id: member._id,
        _id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        position: member.position ? {
          id: member.position._id,
          title: member.position.title,
          code: member.position.code,
          description: member.position.description
        } : null,
        department: member.department ? {
          id: member.department._id,
          name: member.department.name
        } : null,
        role: member.role,
        status: member.status
      })),
      tasks: project.tasks.map(task => ({
        ...task,
        assignee: task.assignee ? {
          id: task.assignee._id,
          name: `${task.assignee.firstName} ${task.assignee.lastName}`,
          firstName: task.assignee.firstName,
          lastName: task.assignee.lastName,
          email: task.assignee.email,
          position: task.assignee.position
        } : null,
        comments: task.comments?.map(comment => ({
          ...comment,
          author: comment.author ? {
            id: comment.author._id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            email: comment.author.email
          } : null
        }))
      }))
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error in getProjectDetails:', error);
    res.status(500).json({ message: error.message });
  }
};

// Test project access
exports.testProjectAccess = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    // This route is protected by hasProjectAccess middleware
    // If we reach here, the user has access to the project

    res.status(200).json({
      success: true,
      message: 'You have access to this project',
      user: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        // roles: req.user.role.map(r => ({
        //   type: r.type,
        //   role_type: r.role_type
        // }))
        roles: req.user.role,
      },
      projectId
    });
  } catch (error) {
    console.error('Error in testProjectAccess:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 