import * as hrmService from '../api/hrm.service';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import api from '../api/api';


const useHrmStore = create(
  persist(
    (set, get) => ({
      // Employees
      employees: [],
      managerEmployees: [],
      selectedEmployee: null,
      employeesLoading: false,
      employeesError: null,

      // Departments
      departments: [],
      selectedDepartment: null,
      departmentsLoading: false,
      departmentsError: null,

      // Positions
      positions: [],
      selectedPosition: null,
      positionsLoading: false,
      positionsError: null,

      // Attendance
      attendance: [],
      attendanceLoading: false,
      attendanceError: null,

      // Leaves
      leaves: [],
      selectedLeave: null,
      leavesLoading: false,
      leavesError: null,

      // Payroll
      payroll: [],
      selectedPayroll: null,
      payrollLoading: false,
      payrollError: null,

      // Events State
      events: [],
      eventsLoading: false,
      eventsError: null,

      // Employee Actions
      fetchEmployees: async (params) => {
        set({ employeesLoading: true, employeesError: null });
        try {
          const employees = await hrmService.getEmployees(params);
          console.log('Raw API response:', employees);
          // Ensure employees is always an array
          const employeesArray = Array.isArray(employees) ? employees : [];
          console.log('Processed employees array:', employeesArray);
          set({ employees: employeesArray, employeesLoading: false });
          return employeesArray;
        } catch (error) {
          console.error('Error fetching employees:', error);
          set({
            employees: [],
            employeesError: error.response?.data?.message || 'Failed to fetch employees',
            employeesLoading: false,
          });
          throw error;
        }
      },

      fetchManagerEmployees: async () => {
        set({ employeesLoading: true, employeesError: null });
        try {
          const managers = await hrmService.getManagerEmployees();
          set({ managerEmployees: managers, employeesLoading: false });
        } catch (error) {
          set({
            managerEmployees: [],
            employeesError: error.response?.data?.error?.message || 'Failed to fetch managers',
            employeesLoading: false,
          });
        }
      },

      fetchEmployee: async (id) => {
        set({ employeesLoading: true, employeesError: null });
        try {
          const employee = await hrmService.getEmployee(id);
          set({ selectedEmployee: employee, employeesLoading: false });
        } catch (error) {
          set({
            employeesError: error.response?.data?.error?.message || 'Failed to fetch employee',
            employeesLoading: false,
          });
        }
      },

      createEmployee: async (data) => {
        set({ employeesLoading: true, employeesError: null });
        try {
          const employee = await hrmService.createEmployee(data);
          set(state => ({
            employees: [...state.employees, employee],
            employeesLoading: false
          }));
          return employee;
        } catch (error) {
          set({
            employeesError: error.response?.data?.message || 'Failed to create employee',
            employeesLoading: false,
          });
          throw error;
        }
      },

      updateEmployee: async (id, data) => {
        set({ employeesLoading: true, employeesError: null });
        try {
          console.log('Store: Updating employee with ID:', id);
          console.log('Update data:', data);
          
          const employee = await hrmService.updateEmployee(id, data);
          console.log('Updated employee returned from service:', employee);
          
          set(state => {
            console.log('Current employees in state:', state.employees);
            
            // More robust ID matching logic
            const updatedEmployees = state.employees.map(e => {
              // Convert IDs to strings for consistent comparison
              const employeeId = (e._id || e.id || '').toString();
              const updateId = (id || '').toString();
              
              console.log(`Comparing employee ID: ${employeeId} with update ID: ${updateId}`);
              
              return employeeId === updateId ? employee : e;
            });
            
            console.log('Updated employees array:', updatedEmployees);
            
            return {
              employees: updatedEmployees,
              employeesLoading: false
            };
          });
          
          return employee;
        } catch (error) {
          console.error('Store: Error in updateEmployee:', error);
          set({
            employeesError: error.response?.data?.message || 'Failed to update employee',
            employeesLoading: false,
          });
          throw error;
        }
      },

      deleteEmployee: async (id) => {
        set({ employeesLoading: true, employeesError: null });
        try {
          await hrmService.deleteEmployee(id);
          set(state => ({
            employees: state.employees.filter(e => e._id !== id),
            employeesLoading: false
          }));
        } catch (error) {
          set({
            employeesError: error.response?.data?.message || 'Failed to delete employee',
            employeesLoading: false,
          });
          throw error;
        }
      },

      // Get next employee ID
      getNextEmployeeId: async () => {
        try {
          console.log('Requesting next employee ID from store...');
          const response = await hrmService.getNextEmployeeId();
          console.log('Next employee ID response in store:', response);
          return response;
        } catch (error) {
          console.error('Error getting next employee ID:', error);
          throw error;
        }
      },

      // Get current employee profile
      getCurrentEmployee: async () => {
        try {
          const response = await hrmService.getCurrentEmployee();
          return response;
        } catch (error) {
          console.error('Error getting current employee:', error);
          throw error;
        }
      },

      // Update current employee profile
      updateProfile: async (data) => {
        try {
          console.log('updateProfile called with data:', data);
          const isFormData = data instanceof FormData;
          console.log('Is FormData:', isFormData);

          let response;
          if (isFormData) {
            // Handle profile picture upload
            response = await api.post('hrm/employees/me/profile-picture', data, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            // Update the employee in the store with new profile picture
            if (response.data?.employee?.profilePicture) {
              set(state => ({
                employees: state.employees.map(emp => {
                  if (emp._id === response.data.employee._id) {
                    return {
                      ...emp,
                      profilePicture: response.data.employee.profilePicture
                    };
                  }
                  return emp;
                })
              }));
            }
          } else {
            // Handle regular profile update
            response = await api.patch('hrm/employees/me', data);
          }

          console.log('updateProfile response:', response);
          return response.data;
        } catch (error) {
          console.error('Error updating profile:', error.response?.data || error);
          throw error;
        }
      },

      // Update employee profile picture
      updateEmployeeProfilePicture: async (employeeId, formData) => {
        try {
          console.log('Updating employee profile picture:', employeeId);
          const response = await api.post(`hrm/employees/${employeeId}/profile-picture`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          // Update the employee in the store with new profile picture
          if (response.data?.employee?.profilePicture) {
            set(state => ({
              employees: state.employees.map(emp => {
                if (emp._id === employeeId || emp.id === employeeId) {
                  return {
                    ...emp,
                    profilePicture: response.data.employee.profilePicture
                  };
                }
                return emp;
              })
            }));
          }

          return response.data;
        } catch (error) {
          console.error('Error updating employee profile picture:', error);
          throw error;
        }
      },

      // Document Management
      documents: [],
      documentsLoading: false,
      documentsError: null,

      // Fetch employee documents
      fetchEmployeeDocuments: async (employeeId) => {
        try {
          set({ documentsLoading: true, documentsError: null });
          const response = await api.get(`hrm/employees/${employeeId}/documents`);
          set({ documents: response.data.documents, documentsLoading: false });
          return response.data.documents;
        } catch (error) {
          console.error('Error fetching documents:', error);
          set({ 
            documentsError: error.response?.data?.message || 'Failed to fetch documents',
            documentsLoading: false 
          });
          throw error;
        }
      },

      // Upload document
      uploadEmployeeDocument: async (employeeId, formData) => {
        try {
          console.log('Store: Starting document upload...');
          console.log('Employee ID:', employeeId);
          console.log('FormData contents:');
          for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
          }

          const response = await api.post(`hrm/employees/${employeeId}/documents`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          // Update the employee's documents in the store
          set(state => {
            const updatedEmployees = state.employees.map(emp => {
              if (emp._id === employeeId || emp.id === employeeId) {
                const updatedDocuments = [...(emp.documents || []), response.data.document];
                return {
                  ...emp,
                  documents: updatedDocuments
                };
              }
              return emp;
            });
            return { employees: updatedEmployees };
          });
          
          return response.data;
        } catch (error) {
          console.error('Store: Document upload error:', error);
          throw error;
        }
      },

      // Download document
      downloadDocument: async (documentUrl, fileName, employeeId, documentId) => {
        try {
          console.log('Store: Downloading document:', { employeeId, documentId, fileName });
          
          const blob = await hrmService.downloadDocument(employeeId, documentId);
          
          // Create blob URL and trigger download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);

          return true;
        } catch (error) {
          console.error('Store: Error downloading document:', error);
          toast.error('Failed to download document. Please try again.');
          throw error;
        }
      },

      // Delete document
      deleteDocument: async (employeeId, documentId) => {
        try {
          console.log('Deleting document:', { employeeId, documentId });
          
          // Store the current state before deletion for rollback
          const previousState = get().employees;
          
          // Optimistically update the UI
          set(state => ({
            employees: state.employees.map(emp => {
              if (emp._id === employeeId || emp.id === employeeId) {
                return {
                  ...emp,
                  documents: emp.documents.filter(doc => doc._id !== documentId)
                };
              }
              return emp;
            })
          }));

          // Make the API call
          const response = await api.delete(`hrm/employees/${employeeId}/documents/${documentId}`);
          
          toast.success('Document deleted successfully');
          return response.data;
        } catch (error) {
          console.error('Error deleting document:', error);
          
          // Rollback to previous state on error
          set({ employees: previousState });
          
          toast.error('Failed to delete document. Please try again.');
          throw error;
        }
      },

      // Department Actions
      fetchDepartments: async () => {
        set({ departmentsLoading: true, departmentsError: null });
        try {
          const response = await hrmService.getDepartments();
          console.log('Fetched departments:', response);
          set({ 
            departments: response.data.departments, 
            departmentsLoading: false 
          });
        } catch (error) {
          console.error('Error fetching departments:', error);
          set({
            departments: [],
            departmentsError: error.response?.data?.message || 'Failed to fetch departments',
            departmentsLoading: false,
          });
        }
      },

      fetchDepartment: async (id) => {
        set({ departmentsLoading: true, departmentsError: null });
        try {
          const department = await hrmService.getDepartment(id);
          set({ selectedDepartment: department, departmentsLoading: false });
        } catch (error) {
          set({
            departmentsError: error.response?.data?.error?.message || 'Failed to fetch department',
            departmentsLoading: false,
          });
        }
      },

      createDepartment: async (data) => {
        set({ departmentsLoading: true, departmentsError: null });
        try {
          const department = await hrmService.createDepartment(data);
          set(state => ({
            departments: [...state.departments, department],
            departmentsLoading: false
          }));
          return department;
        } catch (error) {
          set({
            departmentsError: error.response?.data?.message || 'Failed to create department',
            departmentsLoading: false,
          });
          throw error;
        }
      },

      updateDepartment: async (id, data) => {
        set({ departmentsLoading: true, departmentsError: null });
        try {
          const department = await hrmService.updateDepartment(id, data);
          set(state => ({
            departments: state.departments.map(d => d._id === id ? department : d),
            departmentsLoading: false
          }));
          return department;
        } catch (error) {
          set({
            departmentsError: error.response?.data?.message || 'Failed to update department',
            departmentsLoading: false,
          });
          throw error;
        }
      },

      deleteDepartment: async (id) => {
        set({ departmentsLoading: true, departmentsError: null });
        try {
          await hrmService.deleteDepartment(id);
          set(state => ({
            departments: state.departments.filter(d => d._id !== id),
            departmentsLoading: false
          }));
        } catch (error) {
          set({
            departmentsError: error.response?.data?.message || 'Failed to delete department',
            departmentsLoading: false,
          });
          throw error;
        }
      },

      // Get next department code
      getNextDepartmentCode: async () => {
        try {
          console.log('Requesting next department code from store...');
          const response = await hrmService.getNextDepartmentCode();
          console.log('Next department code response in store:', response);
          return response;
        } catch (error) {
          console.error('Error getting next department code:', error);
          throw error;
        }
      },

      // Position Actions
      fetchPositions: async () => {
        set({ positionsLoading: true, positionsError: null });
        try {
          const positions = await hrmService.getPositions();
          console.log('Raw positions response:', positions);
          // Ensure positions is always an array
          const positionsArray = Array.isArray(positions) ? positions : [];
          console.log('Processed positions array:', positionsArray);
          set({ positions: positionsArray, positionsLoading: false });
          return positionsArray;
        } catch (error) {
          console.error('Error fetching positions:', error);
          set({
            positions: [],
            positionsError: error.response?.data?.error?.message || 'Failed to fetch positions',
            positionsLoading: false,
          });
        }
      },

      getNextPositionCode: async () => {
        try {
          const response = await hrmService.getNextPositionCode();
          return response;
        } catch (error) {
          console.error('Error getting next position code:', error);
          throw error;
        }
      },

      fetchPosition: async (id) => {
        set({ positionsLoading: true, positionsError: null });
        try {
          const position = await hrmService.getPosition(id);
          set({ selectedPosition: position, positionsLoading: false });
        } catch (error) {
          set({
            positionsError: error.response?.data?.error?.message || 'Failed to fetch position',
            positionsLoading: false,
          });
        }
      },

      createPosition: async (data) => {
        set({ positionsLoading: true, positionsError: null });
        try {
          const position = await hrmService.createPosition(data);
          set(state => ({
            positions: [...state.positions, position],
            positionsLoading: false
          }));
          return position;
        } catch (error) {
          set({
            positionsError: error.response?.data?.message || 'Failed to create position',
            positionsLoading: false,
          });
          throw error;
        }
      },

      updatePosition: async (id, data) => {
        set({ positionsLoading: true, positionsError: null });
        try {
          const position = await hrmService.updatePosition(id, data);
          set(state => ({
            positions: state.positions.map(p => p._id === id ? position : p),
            positionsLoading: false
          }));
          return position;
        } catch (error) {
          set({
            positionsError: error.response?.data?.message || 'Failed to update position',
            positionsLoading: false,
          });
          throw error;
        }
      },

      deletePosition: async (id) => {
        set({ positionsLoading: true, positionsError: null });
        try {
          await hrmService.deletePosition(id);
          set(state => ({
            positions: state.positions.filter(p => p._id !== id),
            positionsLoading: false
          }));
        } catch (error) {
          set({
            positionsError: error.response?.data?.message || 'Failed to delete position',
            positionsLoading: false,
          });
          throw error;
        }
      },

      // Attendance Actions
      fetchAttendance: async (params) => {
        set({ attendanceLoading: true, attendanceError: null });
        try {
          const response = await hrmService.getAttendance(params);
          console.log('Attendance response:', response); // Debug log
          set({
            attendance: response.data?.attendance || [],
            attendanceLoading: false
          });
        } catch (error) {
          console.error('Error fetching attendance:', error); // Debug log
          set({
            attendance: [],
            attendanceError: error.response?.data?.message || 'Failed to fetch attendance',
            attendanceLoading: false
          });
          throw error;
        }
      },

      updateAttendance: async (id, data) => {
        set({ attendanceLoading: true, attendanceError: null });
        try {
          const response = await hrmService.updateAttendance(id, data);
          const updatedAttendance = response.data?.attendance;

          if (!updatedAttendance) {
            console.error('Invalid response format:', response);
            throw new Error('Invalid response format from server');
          }

          set(state => ({
            attendance: state.attendance.map(a =>
              a._id === id ? updatedAttendance : a
            ),
            attendanceLoading: false
          }));
          return updatedAttendance;
        } catch (error) {
          console.error('Error updating attendance:', error);
          set({
            attendanceError: error.response?.data?.message || error.message || 'Failed to update attendance',
            attendanceLoading: false
          });
          throw error;
        }
      },

      getAttendanceStats: async (params) => {
        try {
          const response = await hrmService.getAttendanceStats(params);
          console.log('Store getAttendanceStats response:', response);
          return { stats: response.stats };
        } catch (error) {
          console.error('Store getAttendanceStats error:', error);
          throw error;
        }
      },

      checkIn: async (data) => {
        try {
          const response = await hrmService.checkIn(data);
          return response;
        } catch (error) {
          throw error;
        }
      },

      checkOut: async (id) => {
        try {
          const response = await hrmService.checkOut(id);
          return response;
        } catch (error) {
          throw error;
        }
      },

      createBulkAttendance: async (data) => {
        try {
          const response = await hrmService.createBulkAttendance(data);
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Leave Actions
      fetchLeaves: async () => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leaves = await hrmService.getLeaves();
          // Ensure leaves is always an array
          const leavesArray = Array.isArray(leaves) ? leaves : [];
          console.log('Fetched leaves:', leavesArray);
          set({ leaves: leavesArray, leavesLoading: false });
          return leavesArray;
        } catch (error) {
          console.error('Error fetching leaves:', error);
          set({
            leaves: [],
            leavesError: error.response?.data?.message || 'Failed to fetch leaves',
            leavesLoading: false,
          });
          throw error;
        }
      },

      getMyLeave: async () => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const response = await hrmService.getMyLeave();
          return response;
        } catch (error) {
          console.error('Error fetching my leaves:', error);
          set({
            leavesError: error.response?.data?.message || 'Failed to fetch my leaves',
            leavesLoading: false,
          });
          throw error;
        }
      },

      fetchLeave: async (id) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.getLeave(id);
          set({ selectedLeave: leave, leavesLoading: false });
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to fetch leave',
            leavesLoading: false,
          });
        }
      },

      createLeave: async (data) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.createLeave(data);
          set(state => ({
            leaves: [...state.leaves, leave],
            leavesLoading: false
          }));
          return leave;
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to create leave',
            leavesLoading: false,
          });
          throw error;
        }
      },

      updateLeave: async (id, data) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.updateLeave(id, data);
          set(state => ({
            leaves: state.leaves.map(l => l._id === id ? leave : l),
            leavesLoading: false
          }));
          return leave;
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to update leave',
            leavesLoading: false,
          });
          throw error;
        }
      },
      reviewLeave: async (id, data) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.reviewLeave(id, data);
          set(state => ({
            leaves: state.leaves.map(l => l._id === id ? leave : l),
            leavesLoading: false
          }));
          return leave;
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to review leave',
            leavesLoading: false,
          });
          throw error;
        }
      },
      deleteLeave: async (id) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          await hrmService.deleteLeave(id);
          set(state => ({
            leaves: state.leaves.filter(l => l._id !== id),
            leavesLoading: false
          }));
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to delete leave',
            leavesLoading: false,
          });
          throw error;
        }
      },

      approveLeave: async (id) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.approveLeave(id);
          set(state => ({
            leaves: state.leaves.map(l => l._id === id ? leave : l),
            leavesLoading: false
          }));
          return leave;
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to approve leave',
            leavesLoading: false,
          });
          throw error;
        }
      },

      rejectLeave: async (id) => {
        set({ leavesLoading: true, leavesError: null });
        try {
          const leave = await hrmService.rejectLeave(id);
          set(state => ({
            leaves: state.leaves.map(l => l._id === id ? leave : l),
            leavesLoading: false
          }));
          return leave;
        } catch (error) {
          set({
            leavesError: error.response?.data?.message || 'Failed to reject leave',
            leavesLoading: false,
          });
          throw error;
        }
      },

      // Payroll Actions
      fetchPayroll: async (params) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const payroll = await hrmService.getPayroll(params);
          set({
            payroll: Array.isArray(payroll) ? payroll : [],
            payrollLoading: false,
            payrollError: null
          });
          console.log('Fetched payroll:', payroll);
        } catch (error) {
          console.error('Error fetching payroll:', error);
          set({
            payroll: [],
            payrollError: error.response?.data?.message || 'Failed to fetch payroll',
            payrollLoading: false
          });
        }
      },

      getMyPayroll: async () => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const response = await hrmService.getMyPayroll();
          console.log('My Payroll Response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch payroll data');
          }
          return response;
        } catch (error) {
          console.error('Error fetching my payroll:', error);
          set({
            payrollError: error.response?.data?.message || error.message || 'Failed to fetch payroll',
            payrollLoading: false
          });
          throw error;
        } finally {
          set({ payrollLoading: false });
        }
      },

      fetchPayrollById: async (id) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const payroll = await hrmService.getPayrollById(id);
          set({ selectedPayroll: payroll, payrollLoading: false });
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to fetch payroll',
            payrollLoading: false,
          });
        }
      },

      createPayroll: async (data) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const payroll = await hrmService.createPayroll(data);
          set(state => ({
            payroll: [...state.payroll, payroll],
            payrollLoading: false
          }));
          return payroll;
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to create payroll',
            payrollLoading: false,
          });
          throw error;
        }
      },

      updatePayroll: async (id, data) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const payroll = await hrmService.updatePayroll(id, data);
          set(state => ({
            payroll: state.payroll.map(p => p._id === id ? payroll : p),
            payrollLoading: false
          }));
          return payroll;
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to update payroll',
            payrollLoading: false,
          });
          throw error;
        }
      },

      deletePayroll: async (id) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          await hrmService.deletePayroll(id);
          set(state => ({
            payroll: state.payroll.filter(p => p._id !== id),
            payrollLoading: false
          }));
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to delete payroll',
            payrollLoading: false,
          });
          throw error;
        }
      },

      generatePayroll: async (params) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const payroll = await hrmService.generatePayroll(params);
          set(state => ({
            payroll: [...state.payroll, payroll],
            payrollLoading: false
          }));
          return payroll;
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to generate payroll',
            payrollLoading: false,
          });
          throw error;
        }
      },

      downloadPayroll: async (id) => {
        set({ payrollLoading: true, payrollError: null });
        try {
          const blob = await hrmService.downloadPayroll(id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payroll-${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          set({ payrollLoading: false });
        } catch (error) {
          set({
            payrollError: error.response?.data?.message || 'Failed to download payroll',
            payrollLoading: false,
          });
          throw error;
        }
      },

      // Events Actions
      fetchEvents: async () => {
        set({ eventsLoading: true, eventsError: null });
        try {
          console.log('Fetching events from store...');
          const response = await hrmService.getEvents();
          console.log('Events fetched in store:', response);

          // Extract events array from response
          const eventsArray = response?.events || [];

          // Validate events data
          if (!Array.isArray(eventsArray)) {
            console.error('Invalid events data structure:', response);
            throw new Error('Invalid events data structure received');
          }

          set({
            events: eventsArray, // Store just the events array
            eventsLoading: false,
            eventsError: null
          });
          return eventsArray;
        } catch (error) {
          console.error('Error in store fetchEvents:', error);
          set({
            events: [],
            eventsError: error.message || 'Failed to fetch events',
            eventsLoading: false,
          });
          return []; // Return empty array instead of throwing
        }
      },

      createEvent: async (data) => {
        set({ eventsLoading: true, eventsError: null });
        try {
          const event = await hrmService.createEvent(data);
          set(state => ({
            events: [...state.events, event],
            eventsLoading: false
          }));
          return event;
        } catch (error) {
          set({
            eventsError: error.response?.data?.message || 'Failed to create event',
            eventsLoading: false,
          });
          throw error;
        }
      },

      updateEvent: async (id, data) => {
        set({ eventsLoading: true, eventsError: null });
        try {
          console.log('Store: Updating event:', { id, data });
          const event = await hrmService.updateEvent(id, data);
          console.log('Store: Update successful:', event);

          set(state => ({
            events: state.events.map(e => e._id === id ? event : e),
            eventsLoading: false,
            eventsError: null
          }));
          return event;
        } catch (error) {
          console.error('Store: Error updating event:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update event';
          set({
            eventsError: errorMessage,
            eventsLoading: false
          });
          throw new Error(errorMessage);
        }
      },

      deleteEvent: async (id) => {
        set({ eventsLoading: true, eventsError: null });
        try {
          await hrmService.deleteEvent(id);
          set(state => ({
            events: state.events.filter(e => e._id !== id),
            eventsLoading: false
          }));
        } catch (error) {
          set({
            eventsError: error.response?.data?.message || 'Failed to delete event',
            eventsLoading: false,
          });
          throw error;
        }
      },

      // Clear Errors
      clearErrors: () => {
        set({
          employeesError: null,
          departmentsError: null,
          positionsError: null,
          attendanceError: null,
          leavesError: null,
          payrollError: null,
        });
      },

      deleteAttendance: async (id) => {
        set({ attendanceLoading: true });
        try {
          const response = await hrmService.deleteAttendance(id);

          // Update the attendance list by removing the deleted record
          set((state) => ({
            attendance: state.attendance.filter(record => record._id !== id),
            attendanceLoading: false
          }));

          return { success: true };
        } catch (error) {
          set({
            attendanceError: error.response?.data?.message || 'Failed to delete attendance',
            attendanceLoading: false
          });
          throw error;
        }
      },

      getMyAttendance: async (params) => {
        set({ attendanceLoading: true, attendanceError: null });
        try {
          const response = await hrmService.getMyAttendance(params);
          return response;
        } catch (error) {
          set({
            attendanceError: error.response?.data?.message || 'Failed to fetch attendance',
            attendanceLoading: false
          });
          throw error;
        } finally {
          set({ attendanceLoading: false });
        }
      },
    }),
    {
      name: 'hrm-store',
      storage: createJSONStorage(() => localStorage),
    }
  ));

export default useHrmStore; 