import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import useHrmStore from '@/stores/useHrmStore';

const PaySlip = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paySlipData, setPaySlipData] = useState(null);
  const [dataNotFound, setDataNotFound] = useState(false);
  const formRef = useRef(null);

  const { getMyPayroll, payrollLoading, payrollError } = useHrmStore();

  // Get current date and last 6 months
  const getCurrentAndPast6Months = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(format(date, 'MMMM yyyy'));
    }
    return months;
  };

  const months = getCurrentAndPast6Months();

  const fetchPayrollData = async (month) => {
    try {
      setLoading(true);
      setDataNotFound(false);
      setError(null);
      const employeeData = JSON.parse(localStorage.getItem('user'));

      if (!employeeData || !employeeData.employeeId) {
        throw new Error('Employee data not found');
      }

      // Convert month string to date format for comparison
      const [monthName, year] = month.split(' ');
      const selectedDate = new Date(Date.UTC(parseInt(year), new Date(`${monthName} 1, ${year}`).getMonth(), 1));
      
      console.log('Fetching payroll for:', {
        month,
        selectedDate: selectedDate.toISOString(),
        employeeId: employeeData.employeeId
      });

      // Get all payroll data for the employee
      const response = await getMyPayroll();
      console.log('Payroll Response:', response);

      if (!response || !response.success || !response.data) {
        throw new Error('Failed to fetch payroll data');
      }

      // Convert the payroll data to array if it's not already
      const payrollArray = Array.isArray(response.data) ? response.data : [response.data];

      // Find the matching payroll for the selected month
      const payrollData = payrollArray.find(payroll => {
        if (!payroll || !payroll.period) return false;
        const payrollDate = new Date(payroll.period);
        return payrollDate.getMonth() === selectedDate.getMonth() && 
               payrollDate.getFullYear() === selectedDate.getFullYear();
      });

      if (!payrollData) {
        console.log('No payroll found for period:', month);
        setDataNotFound(true);
        setPaySlipData(null);
        // toast.error('No payroll data found for selected month');
        return;
      }

      console.log('Found matching payroll data:', payrollData);

      // Helper function to safely format dates
      const safeFormatDate = (dateString) => {
        try {
          if (!dateString) return 'N/A';
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'N/A';
          return format(date, 'dd-MM-yyyy');
        } catch (error) {
          console.warn('Error formatting date:', error);
          return 'N/A';
        }
      };

      setPaySlipData({
        employeeDetails: {
          name: `${employeeData.firstName} ${employeeData.lastName}`,
          employeeId: employeeData.employeeId,
          department: payrollData.employee.department?.name || 'N/A',
          position: payrollData.employee.position?.title || 'N/A',
          contactNumber: payrollData.employee.phone || 'N/A',
          email: payrollData.employee.email,
          joiningDate: safeFormatDate(payrollData.employee.joiningDate)
        },
        paymentDetails: {
          bankAccount: employeeData.bankDetails?.accountNumber || 'N/A',
          bankName: employeeData.bankDetails?.bankName || 'N/A',
          payPeriod: month,
          paymentDate: safeFormatDate(payrollData.updatedAt)
        },
        earnings: {
          basicSalary: payrollData.basicSalary || 0,
          transportAllowance: payrollData.allowances?.transport || 0,
          mobile: payrollData.allowances?.mobile || 0,
          bonus: payrollData.allowances?.bonus || 0
        },
        deductions: {
          providentFund: payrollData.deductions?.pf || 0,
          other: payrollData.deductions?.other || 0
        }
      });
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      const errorMessage = err.message || 'Failed to fetch payroll data';
      toast.error(errorMessage);
      setError(errorMessage);
      setPaySlipData(null);
      setDataNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchPayrollData(selectedMonth);
    }
  }, [selectedMonth]);

  useEffect(() => {
    // Set initial month to current month
    setSelectedMonth(months[0]);
  }, []);

  // Use loading state from both local and store
  const isLoading = loading || payrollLoading;

  // Use error state from both local and store
  useEffect(() => {
    if (payrollError) {
      setError(payrollError);
      toast.error(payrollError);
    }
  }, [payrollError]);

  const totalEarnings = Object.values(paySlipData?.earnings || {}).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(paySlipData?.deductions || {}).reduce((a, b) => a + b, 0);
  const netPay = totalEarnings - totalDeductions;

  const generatePDF = async () => {
    const element = document.getElementById('payslip-content');
    if (!element) {
      setError('PDF generation failed: Element not found');
      return;
    }

    try {
      setLoading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        height: element.offsetHeight,
        width: element.offsetWidth
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, '', 'FAST');
      
      return pdf;
    } catch (err) {
      setError('PDF generation failed');
      console.error('PDF generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // const handleShare = async () => {
  //   try {
  //     const pdf = await generatePDF();
  //     if (!pdf) {
  //       setError('Failed to generate PDF for sharing');
  //       return;
  //     }

  //     const pdfBlob = pdf.output('blob');
  //     const fileName = `payslip-${selectedMonth || 'current'}.pdf`;
      
  //     // Create mailto link with subject and body
  //     const subject = encodeURIComponent(`Payslip for ${selectedMonth || 'current month'}`);
  //     const body = encodeURIComponent(`Please find attached the payslip for ${selectedMonth || 'current month'}.`);
      
  //     // Convert blob to base64 data URL
  //     const reader = new FileReader();
  //     reader.readAsDataURL(pdfBlob);
  //     reader.onloadend = () => {
  //       // Create temporary link to trigger email client
  //       const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  //       window.location.href = mailtoLink;
  //     };

  //   } catch (err) {
  //     console.error('Share failed:', err);
  //     setError('Failed to share PDF. Please try downloading instead.');
  //   }
  // };


  const handleDownload = async () => {
    try {
      const pdf = await generatePDF();
      if (pdf) {
        pdf.save(`payslip-${selectedMonth || 'current'}.pdf`);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('payslip-content');
    const originalContents = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-auto rounded-md border border-gray-300 px-9 py-2"
        >
          {months.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        
        {paySlipData && (
          <div className="flex flex-wrap gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 w-full sm:w-auto min-w-[120px]"
              disabled={loading}
            >
              <span>🖨️</span>
              Print
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 w-full sm:w-auto min-w-[120px]"
              disabled={loading}
            >
              <span>⬇️</span>
              Download
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {dataNotFound ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-xl text-gray-600 mb-2">No PaySlip Available</div>
          <div className="text-sm text-gray-500">Please select a different month or contact HR if you believe this is an error.</div>
        </div>
      ) : paySlipData ? (
        <Card className="max-w-4xl mx-auto" id="payslip-content">
          <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 border-b pb-6 gap-4">
              <div className="flex flex-col gap-4 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <img
                    src="https://www.xyvin.com/_next/static/media/logo.6f54e6f8.svg"
                    alt="Xyvin Technologies Logo"
                    className="w-32 h-10 object-contain"
                    crossOrigin="anonymous"
                  />
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-[#2563eb]">Xyvin Technologies Private Limited</h1>
                    <p className="text-gray-500">PaySlip for {paySlipData.paymentDetails.payPeriod}</p>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right w-full sm:w-auto">
                <p className="font-medium">PaySlip #{paySlipData.employeeDetails.employeeId}-{paySlipData.paymentDetails.payPeriod?.split(' ')[0].substring(0, 3)}</p>
                <p className="text-gray-500">Payment Date: {paySlipData.paymentDetails.paymentDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="w-full">
                <h2 className="text-lg font-semibold mb-4">Employee Details</h2>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-right">{paySlipData.employeeDetails.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Employee ID:</span>
                    <span className="text-right">{paySlipData.employeeDetails.employeeId}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Department:</span>
                    <span className="text-right">{paySlipData.employeeDetails.department}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Position:</span>
                    <span className="text-right">{paySlipData.employeeDetails.position}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Joining Date:</span>
                    <span className="text-right">{paySlipData.employeeDetails.joiningDate}</span>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Bank Name:</span>
                    <span className="text-right">{paySlipData.paymentDetails.bankName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Account Number:</span>
                    <span className="text-right">{paySlipData.paymentDetails.bankAccount}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="text-gray-600 font-medium">Pay Period:</span>
                    <span className="text-right">{paySlipData.paymentDetails.payPeriod}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Earnings</h3>
                <div className="space-y-3">
                  {Object.entries(paySlipData.earnings).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row justify-between gap-2">
                      <span className="text-gray-600 font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="text-right">₹{value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex flex-col sm:flex-row justify-between gap-2 font-semibold">
                      <span>Total Earnings</span>
                      <span className="text-right">₹{totalEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Deductions</h3>
                <div className="space-y-3">
                  {Object.entries(paySlipData.deductions).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row justify-between gap-2">
                      <span className="text-gray-600 font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="text-right">₹{value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex flex-col sm:flex-row justify-between gap-2 font-semibold">
                      <span>Total Deductions</span>
                      <span className="text-right">₹{totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <span className="text-xl font-bold">Net Pay</span>
                <span className="text-xl font-bold text-blue-600 text-right">₹{netPay.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="mb-8">_________________</div>
                <div className="text-gray-600">Employee Signature</div>
              </div>
              <div className="text-center">
                <div className="mb-8">_________________</div>
                <div className="text-gray-600">Authorized Signature</div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default PaySlip;