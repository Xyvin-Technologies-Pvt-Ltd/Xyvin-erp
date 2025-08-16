import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, PieChart } from "@/components/ui/charts";
import {
  CurrencyRupeeIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,

} from "@heroicons/react/24/outline";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const FRMDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [expenseStats, setExpenseStats] = useState(null);
  const [personalLoanStats, setPersonalLoanStats] = useState(null);
  const [officeLoanStats, setOfficeLoanStats] = useState(null);
  const [profitStats, setProfitStats] = useState(null);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [expenses, personalLoans, officeLoans, profits] = await Promise.all([
        frmService.getExpenses(),
        frmService.getPersonalLoans(),
        frmService.getOfficeLoans(),
        frmService.getProfits(),
      ]);

      // Format expense stats
      const formattedExpenseStats = {
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalCount: expenses.length,
        pendingCount: expenses.filter((exp) => exp.status === "Pending").length,
        approvedCount: expenses.filter((exp) => exp.status === "Approved")
          .length,
        rejectedCount: expenses.filter((exp) => exp.status === "Rejected")
          .length,
        pendingAmount: expenses
          .filter((exp) => exp.status === "Pending")
          .reduce((sum, exp) => sum + exp.amount, 0),
        approvedAmount: expenses
          .filter((exp) => exp.status === "Approved")
          .reduce((sum, exp) => sum + exp.amount, 0),
        rejectedAmount: expenses
          .filter((exp) => exp.status === "Rejected")
          .reduce((sum, exp) => sum + exp.amount, 0),
        monthlyTrend: expenses.reduce((acc, exp) => {
          const month = new Date(exp.date).getMonth();
          acc[month] = (acc[month] || 0) + exp.amount;
          return acc;
        }, Array(12).fill(0)),
        categoryDistribution: Object.entries(
          expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
          }, {})
        ).map(([category, amount]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: amount,
        })),
      };

      setExpenseStats(formattedExpenseStats);
      
      // Calculate personal loan stats from actual loan data
      const personalLoanStats = {
        totalAmount: personalLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
        totalCount: personalLoans.length,
        loans: personalLoans
      };
      
      // Calculate office loan stats from actual loan data
      const officeLoanStats = {
        totalAmount: officeLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
        totalCount: officeLoans.length,
        loans: officeLoans
      };
      
      setPersonalLoanStats(personalLoanStats);
      setOfficeLoanStats(officeLoanStats);

      // Calculate profit stats from actual profit data
      const profitData = {
        totalAmount: profits.reduce((sum, profit) => sum + (profit.amount || 0), 0),
        totalCount: profits.length,
        monthlyTrend: profits.reduce((acc, profit) => {
          const month = new Date(profit.date).getMonth();
          acc[month] = (acc[month] || 0) + (profit.amount || 0);
          return acc;
        }, Array(12).fill(0)),
        categoryDistribution: Object.entries(
          profits.reduce((acc, profit) => {
            acc[profit.category] = (acc[profit.category] || 0) + (profit.amount || 0);
            return acc;
          }, {})
        ).map(([category, amount]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: amount,
        })),
      };
      setProfitStats(profitData);

      // Calculate monthly trends for loans
      const personalLoanMonthlyTrend = personalLoans.reduce((acc, loan) => {
        if (loan.createdAt) {
          const month = new Date(loan.createdAt).getMonth();
          acc[month] = (acc[month] || 0) + (loan.amount || 0);
        }
        return acc;
      }, Array(12).fill(0));

      const officeLoanMonthlyTrend = officeLoans.reduce((acc, loan) => {
        if (loan.createdAt) {
          const month = new Date(loan.createdAt).getMonth();
          acc[month] = (acc[month] || 0) + (loan.amount || 0);
        }
        return acc;
      }, Array(12).fill(0));

      setPersonalLoanStats({
        ...personalLoanStats,
        monthlyTrend: personalLoanMonthlyTrend
      });
      setOfficeLoanStats({
        ...officeLoanStats,
        monthlyTrend: officeLoanMonthlyTrend
      });
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        `Failed to fetch statistics: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const renderStatisticCards = () => {
    const cards = [
      {
        title: "Total Expenses",
        value: formatCurrency(expenseStats?.totalAmount || 0),
        subtitle: `${expenseStats?.totalCount || 0} transactions`,
        icon: CurrencyRupeeIcon,
        gradient: "from-red-500 to-pink-600",
        bgGradient: "from-red-50 to-pink-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600"
      },
      {
        title: "Personal Loans",
        value: formatCurrency(personalLoanStats?.totalAmount || 0),
        subtitle: `${personalLoanStats?.totalCount || 0} active loans`,
        icon: BanknotesIcon,
        gradient: "from-blue-500 to-indigo-600",
        bgGradient: "from-blue-50 to-indigo-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600"
      },
      {
        title: "Office Loans",
        value: formatCurrency(officeLoanStats?.totalAmount || 0),
        subtitle: `${officeLoanStats?.totalCount || 0} active loans`,
        icon: BanknotesIcon,
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600"
      },
      {
        title: "Total Revenue",
        value: formatCurrency(profitStats?.totalAmount || 0),
        subtitle: `${profitStats?.totalCount || 0} revenue entries`,
        icon: ArrowTrendingUpIcon,
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600"
      },
      {
        title: "Net Position",
        value: formatCurrency(Math.abs((profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0))),
        subtitle: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? "Positive balance" : "Negative balance",
        icon: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
        gradient: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-rose-600",
        bgGradient: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? "from-green-50 to-emerald-50" : "from-red-50 to-rose-50",
        iconBg: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? "bg-green-100" : "bg-red-100",
        iconColor: (profitStats?.totalAmount || 0) - (expenseStats?.totalAmount || 0) >= 0 ? "text-green-600" : "text-red-600"
      }
    ];

    return (
      <div className="flex flex-wrap gap-6 mb-8 justify-center">
        {cards.map((card, index) => (
          <Card key={index} className={`flex-1 min-w-[280px] max-w-[320px] relative overflow-hidden bg-gradient-to-br ${card.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2 leading-tight">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500 leading-tight">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`${card.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="animate-pulse bg-indigo-500 rounded-full h-4 w-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <CurrencyRupeeIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Comprehensive overview of your financial operations and performance metrics.
              </p>
            </div>
          </div>
        </div>

        {renderStatisticCards()}

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Expenses</TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Loans</TabsTrigger>
            <TabsTrigger value="profits" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Expenses vs Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart
                    data={[
                      {
                        name: "Expenses",
                        data: expenseStats?.monthlyTrend || Array(12).fill(0),
                      },
                      {
                        name: "Revenue",
                        data: profitStats?.monthlyTrend || Array(12).fill(0),
                      },
                    ]}
                    categories={[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ]}
                    colors={["#dc2626", "#10b981"]}
                    yAxisWidth={60}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-3 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Expense Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={expenseStats?.categoryDistribution || [
                      { name: "Office", value: 40 },
                      { name: "Travel", value: 30 },
                      { name: "Equipment", value: 20 },
                      { name: "Other", value: 10 },
                    ]}
                    colors={["#0ea5e9", "#f59e0b", "#10b981", "#6366f1"]}
                    height={350}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Monthly Expenses</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart
                    data={[
                      {
                        name: "Expenses",
                        data: expenseStats?.monthlyTrend || Array(12).fill(0),
                      },
                    ]}
                    categories={[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ]}
                    colors={["#dc2626"]}
                    yAxisWidth={60}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-3 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={[
                      {
                        name: "Pending",
                        value: expenseStats?.pendingAmount || 0,
                      },
                      {
                        name: "Approved",
                        value: expenseStats?.approvedAmount || 0,
                      },
                      {
                        name: "Rejected",
                        value: expenseStats?.rejectedAmount || 0,
                      },
                    ]}
                    colors={["#f59e0b", "#16a34a", "#dc2626"]}
                    height={350}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Loan Trends by Creation Date</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Based on loan creation date</p>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart
                    data={[
                      {
                        name: "Personal Loans",
                        data: personalLoanStats?.monthlyTrend || Array(12).fill(0),
                      },
                      {
                        name: "Office Loans",
                        data: officeLoanStats?.monthlyTrend || Array(12).fill(0),
                      },
                    ]}
                    categories={[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ]}
                    colors={["#6366f1", "#0ea5e9"]}
                    yAxisWidth={60}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-3 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Loan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={[
                      {
                        name: "Personal Loans",
                        value: personalLoanStats?.totalCount || 0,
                      },
                      {
                        name: "Office Loans",
                        value: officeLoanStats?.totalCount || 0,
                      },
                    ]}
                    colors={["#6366f1", "#0ea5e9"]}
                    height={350}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profits" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart
                    data={[
                      {
                        name: "Revenue",
                        data: profitStats?.monthlyTrend || Array(12).fill(0),
                      },
                    ]}
                    categories={[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ]}
                    colors={["#10b981"]}
                    yAxisWidth={60}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-3 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={profitStats?.categoryDistribution || [
                      { name: "Sales", value: 0 },
                      { name: "Services", value: 0 },
                      { name: "Investments", value: 0 },
                      { name: "Other", value: 0 },
                    ]}
                    colors={["#10b981", "#0ea5e9", "#f59e0b", "#6366f1"]}
                    height={350}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FRMDashboard;
