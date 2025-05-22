const mongoose = require('mongoose');
require('dotenv').config();

const updateAttendanceIndexes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the attendance collection
        const collection = mongoose.connection.collection('attendances');

        // Drop all existing indexes except _id
        console.log('Dropping all existing indexes...');
        await collection.dropIndexes();
        console.log('All indexes dropped successfully');

        // Create new compound indexes
        console.log('Creating new indexes...');
        
        // Main compound index
        await collection.createIndex(
            { 
                employee: 1, 
                date: 1,
                status: 1,
                isDeleted: 1
            },
            { 
                background: true,
                name: 'attendance_query_index'
            }
        );

        // Date range index
        await collection.createIndex(
            { 
                date: 1,
                isDeleted: 1
            },
            { 
                background: true,
                name: 'attendance_date_index'
            }
        );

        // Employee index
        await collection.createIndex(
            { 
                employee: 1,
                isDeleted: 1
            },
            { 
                background: true,
                name: 'attendance_employee_index'
            }
        );

        // Status index
        await collection.createIndex(
            { 
                status: 1,
                isDeleted: 1
            },
            { 
                background: true,
                name: 'attendance_status_index'
            }
        );

        console.log('New indexes created successfully');

        // Verify indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateAttendanceIndexes(); 