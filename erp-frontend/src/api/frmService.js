import api from './api';

const EXPENSE_URL = '/frm/expenses';
const PERSONAL_LOAN_URL = '/frm/personal-loans';
const OFFICE_LOAN_URL = '/frm/office-loans';
const PROFIT_URL = '/frm/profits';

// Expense Services
const createExpense = async (expenseData) => {
  try {
    // Log the incoming data for debugging
    console.log('Creating expense with data:', {
      ...expenseData,
      documents: expenseData.documents ? `${expenseData.documents.length} files` : 'no files'
    });

    // Create form data only if there are files
    let requestData = expenseData;
    let headers = { 'Content-Type': 'application/json' };

    if (expenseData.documents?.length > 0) {
      const formData = new FormData();
      
      // Append expense data
      Object.keys(expenseData).forEach(key => {
        if (key !== 'documents') {
          formData.append(key, expenseData[key]);
        }
      });

      // Append documents if any
      Array.from(expenseData.documents).forEach(file => {
        formData.append('documents', file);
      });

      requestData = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      // Remove empty documents array if no files
      delete requestData.documents;
    }

    const response = await api.post(EXPENSE_URL, requestData, { headers });
    return response.data;
  } catch (error) {
    console.error('Expense creation error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
};

const getExpenses = async (filters = {}) => {
  try {
    console.log('Calling getExpenses with filters:', filters);
    
    // Clean up filters before sending
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('Clean filters:', cleanFilters);
    
    const response = await api.get(EXPENSE_URL, { params: cleanFilters });
    
    console.log('Raw API response:', response);
    
    if (!response || !response.data) {
      console.error('No data received from server');
      throw new Error('No data received from server');
    }

    // Handle both array and object responses
    const expenses = Array.isArray(response.data) 
      ? response.data 
      : response.data.data || [];
    
    if (!Array.isArray(expenses)) {
      console.error('Expected array but received:', typeof expenses);
      throw new Error('Invalid data format received from server');
    }

    // Validate and transform expense data
    const validatedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount) || 0,
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
      status: expense.status || 'Pending',
      category: expense.category || 'other'
    }));

    console.log('Processed expenses data:', validatedExpenses);
    return validatedExpenses;
  } catch (error) {
    console.error('Error in getExpenses:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

const getExpenseById = async (id) => {
  const response = await api.get(`${EXPENSE_URL}/${id}`);
  return response.data;
};

const updateExpense = async (id, formData) => {
  try {
    const updateData = {};
    
    formData.forEach((value, key) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'amount') {
          updateData[key] = Number(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    const response = await api.put(`${EXPENSE_URL}/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Expense update error details:', error);
    throw error;
  }
};

const deleteExpense = async (id) => {
  try {
    console.log('Deleting expense:', id);
    const response = await api.delete(`${EXPENSE_URL}/${id}`);
    console.log('Delete response:', response);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete expense');
    }
    
    return response.data;
  } catch (error) {
    console.error('Delete expense error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error.response?.data || error;
  }
};

const processExpense = async (id, { status, notes }) => {
  const response = await api.post(`${EXPENSE_URL}/${id}/process`, { status, notes });
  return response.data;
};

const getExpenseStats = async () => {
  try {
    const response = await api.get(`${EXPENSE_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense stats:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get next expense number
const getNextExpenseNumber = async () => {
  try {
    console.log('Requesting next expense number...');
    const response = await api.get(`${EXPENSE_URL}/next-number`);
    console.log('Next expense number response:', response.data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get next expense number');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching next expense number:', error);
    throw error;
  }
};

// Personal Loan Services
const createPersonalLoan = async (loanData) => {
  try {
    console.log('Loan Data:', loanData);
    // Extract only the allowed fields
    const allowedFields = {
      purpose: loanData.purpose,
      amount: loanData.amount,
      term: loanData.term,
      interestRate: loanData.interestRate,
      employmentType: loanData.employmentType,
      monthlyIncome: loanData.monthlyIncome,
      monthlyPayment: loanData.monthlyPayment,
      documents: loanData.documents
    };

    if (allowedFields.documents?.length > 0) {
      const formData = new FormData();
      const loanDataWithoutDocs = { ...allowedFields };
      delete loanDataWithoutDocs.documents;
      console.log('Loan Data without Docs:', loanDataWithoutDocs);
      formData.append('data', JSON.stringify(loanDataWithoutDocs));
      Array.from(allowedFields.documents).forEach((file, index) => {
        console.log(`Appending file ${index}:`, file.name);
        formData.append('documents', file);
      });
      console.log('Sending FormData to:', PERSONAL_LOAN_URL);
      const response = await api.post(PERSONAL_LOAN_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Response:', response.data);
      return response.data.data;
    }
    console.log('Sending JSON to:', PERSONAL_LOAN_URL);
    const response = await api.post(PERSONAL_LOAN_URL, allowedFields, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error Details:', {
      message: error.message,
      config: error.config,
      response: error.response?.data
    });
    throw error.response?.data || error;
  }
};

const getPersonalLoans = async (filters = {}) => {
  const response = await api.get(PERSONAL_LOAN_URL, { params: filters });
  return response.data;
};

const getPersonalLoanById = async (id) => {
  const response = await api.get(`${PERSONAL_LOAN_URL}/${id}`);
  return response.data;
};

const updatePersonalLoan = async (id, loanData) => {
  try {
    // If there are documents, use FormData
    if (loanData.documents?.length > 0) {
      const formData = new FormData();
      
      // Create a copy of loan data without documents
      const loanDataWithoutDocs = { ...loanData };
      delete loanDataWithoutDocs.documents;
      
      // Append loan data as JSON string
      formData.append('data', JSON.stringify(loanDataWithoutDocs));
      
      // Append documents
      Array.from(loanData.documents).forEach(file => {
        formData.append('documents', file);
      });

      const response = await api.put(`${PERSONAL_LOAN_URL}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    // If no documents, send as JSON
    const response = await api.put(`${PERSONAL_LOAN_URL}/${id}`, loanData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating personal loan:', error);
    throw error;
  }
};

const processPersonalLoan = async (id, { status, notes }) => {
  const response = await api.post(`${PERSONAL_LOAN_URL}/${id}/process`, { status, notes });
  return response.data;
};

const recordPersonalLoanPayment = async (id, paymentData) => {
  const response = await api.post(`${PERSONAL_LOAN_URL}/${id}/payment`, paymentData);
  return response.data;
};

const getPersonalLoanStats = async () => {
  try {
    const response = await api.get(`${PERSONAL_LOAN_URL}/stats/overview`);
    return response.data;
  } catch (error) {
    console.error('Error fetching personal loan stats:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

const deletePersonalLoan = async (id) => {
  const response = await api.delete(`${PERSONAL_LOAN_URL}/${id}`);
  return response.data;
};

// Office Loan Services
const createOfficeLoan = async (loanData) => {
  try {
    // If there are documents, use FormData
    if (loanData.documents?.length > 0) {
      const formData = new FormData();
      
      // Append loan data as a JSON string
      const loanDataWithoutDocs = { ...loanData };
      delete loanDataWithoutDocs.documents;
      formData.append('data', JSON.stringify(loanDataWithoutDocs));
      
      // Append documents
      loanData.documents.forEach(file => {
        formData.append('documents', file);
      });

      const response = await api.post(OFFICE_LOAN_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    // If no documents, send as JSON
    const response = await api.post(OFFICE_LOAN_URL, loanData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating office loan:', error);
    throw error;
  }
};

const getOfficeLoans = async (filters = {}) => {
  const response = await api.get(OFFICE_LOAN_URL, { params: filters });
  return response.data;
};

const getOfficeLoanById = async (id) => {
  const response = await api.get(`${OFFICE_LOAN_URL}/${id}`);
  return response.data;
};

const updateOfficeLoan = async (id, loanData) => {
  try {
    // If there are documents, use FormData
    if (loanData.documents?.length > 0) {
      const formData = new FormData();
      
      // Create a copy of loan data without documents
      const loanDataWithoutDocs = { ...loanData };
      delete loanDataWithoutDocs.documents;

      // Append loan data as JSON string
      formData.append('data', JSON.stringify(loanDataWithoutDocs));
      
      // Append documents
      Array.from(loanData.documents).forEach(file => {
        formData.append('documents', file);
      });

      const response = await api.put(`${OFFICE_LOAN_URL}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    // If no documents, send as JSON
    const response = await api.put(`${OFFICE_LOAN_URL}/${id}`, loanData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating office loan:', error);
    throw error;
  }
};

const processOfficeLoan = async (id, { status, notes, repaymentPlan }) => {
  const response = await api.post(`${OFFICE_LOAN_URL}/${id}/process`, { status, notes, repaymentPlan });
  return response.data;
};

const recordOfficeLoanPayment = async (id, paymentData) => {
  const response = await api.post(`${OFFICE_LOAN_URL}/${id}/payment`, paymentData);
  return response.data;
};

const getOfficeLoanStats = async () => {
  try {
    const response = await api.get(`${OFFICE_LOAN_URL}/stats/department`);
    return response.data;
  } catch (error) {
    console.error('Error fetching office loan stats:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

const deleteOfficeLoan = async (id) => {
  const response = await api.delete(`${OFFICE_LOAN_URL}/${id}`);
  return response.data;
};

const getProfits = async (filters = {}) => {
  const response = await api.get(PROFIT_URL, { params: filters });
  return response.data;
};

const getNextProfitNumber = async () => {
  const response = await api.get(`${PROFIT_URL}/next-number`);
  return response.data;
};

const createProfit = async (profitData) => {
  try {
    let requestData = profitData;
    let headers = { 'Content-Type': 'application/json' };

    if (profitData.documents?.length > 0) {
      const formData = new FormData();
      
      // Append profit data
      Object.keys(profitData).forEach(key => {
        if (key !== 'documents') {
          formData.append(key, profitData[key]);
        }
      });

      // Append documents if any
      Array.from(profitData.documents).forEach(file => {
        formData.append('documents', file);
      });

      requestData = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      // Remove empty documents array if no files
      delete requestData.documents;
    }

    const response = await api.post(PROFIT_URL, requestData, { headers });
    return response.data;
  } catch (error) {
    console.error('Profit creation error:', error);
    throw error;
  }
};

const updateProfit = async (id, profitData) => {
  try {
    let requestData = profitData;
    let headers = { 'Content-Type': 'application/json' };

    if (profitData.documents?.length > 0) {
      const formData = new FormData();
      
      // Append profit data
      Object.keys(profitData).forEach(key => {
        if (key !== 'documents') {
          formData.append(key, profitData[key]);
        }
      });

      // Append documents if any
      Array.from(profitData.documents).forEach(file => {
        formData.append('documents', file);
      });

      requestData = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      // Remove empty documents array if no files
      delete requestData.documents;
    }

    const response = await api.put(`${PROFIT_URL}/${id}`, requestData, { headers });
    return response.data;
  } catch (error) {
    console.error('Profit update error:', error);
    throw error;
  }
};

const deleteProfit = async (id) => {
  const response = await api.delete(`${PROFIT_URL}/${id}`);
  return response.data;
};

const frmService = {
  // Expense services
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  processExpense,
  getExpenseStats,
  getNextExpenseNumber,

  // Personal Loan services
  createPersonalLoan,
  getPersonalLoans,
  getPersonalLoanById,
  updatePersonalLoan,
  processPersonalLoan,
  recordPersonalLoanPayment,
  getPersonalLoanStats,
  deletePersonalLoan,

  // Office Loan services
  createOfficeLoan,
  getOfficeLoans,
  getOfficeLoanById,
  updateOfficeLoan,
  processOfficeLoan,
  recordOfficeLoanPayment,
  getOfficeLoanStats,
  deleteOfficeLoan,

  // Profit services
  getProfits,
  getNextProfitNumber,
  createProfit,
  updateProfit,
  deleteProfit
};

export default frmService; 