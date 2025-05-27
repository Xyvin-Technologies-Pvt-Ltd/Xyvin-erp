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
      const [expenses, personalLoans, officeLoans] = await Promise.all([
        frmService.getExpenses(),
        frmService.getPersonalLoanStats(),
        frmService.getOfficeLoanStats(),
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
      setPersonalLoanStats(personalLoans);
      setOfficeLoanStats(officeLoans);

      // Calculate profit stats from the data
      const profitData = {
        totalAmount:
          (formattedExpenseStats?.totalAmount || 0) +
          (personalLoans?.totalAmount || 0) +
          (officeLoans?.totalAmount || 0),
        monthlyTrend: expenses.reduce((acc, exp) => {
          const month = new Date(exp.date).getMonth();
          acc[month] = (acc[month] || 0) + exp.amount;
          return acc;
        }, Array(12).fill(0)),
        categoryDistribution: formattedExpenseStats.categoryDistribution,
      };
      setProfitStats(profitData);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <CurrencyRupeeIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(expenseStats?.totalAmount)}
            </div>
            <p className="text-xs text-gray-500">
              {expenseStats?.totalCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Personal Loans
            </CardTitle>
            <BanknotesIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(personalLoanStats?.totalAmount)}
            </div>
            <p className="text-xs text-gray-500">
              {personalLoanStats?.totalCount} active loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Office Loans</CardTitle>
            <BanknotesIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(officeLoanStats?.totalAmount)}
            </div>
            <p className="text-xs text-gray-500">
              {officeLoanStats?.totalCount} active loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            {profitStats?.totalAmount >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitStats?.totalAmount)}
            </div>
            <p className="text-xs text-gray-500">Overall financial position</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <LineChart
                  data={[
                    {
                      name: "Expenses",
                      data: [165, 170, 156, 180, 177, 185],
                    },
                    {
                      name: "Income",
                      data: [144, 155, 141, 167, 170, 175],
                    },
                  ]}
                  categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                  colors={["#dc2626", "#16a34a"]}
                  yAxisWidth={60}
                  height={350}
                />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={[
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
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <BarChart
                  data={[
                    {
                      name: "Expenses",
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
                  colors={["#dc2626"]}
                  yAxisWidth={60}
                  height={350}
                />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
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
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Loan Trends</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <LineChart
                  data={[
                    {
                      name: "Personal Loans",
                      data: [1200, 1400, 1300, 1800, 1700, 1600],
                    },
                    {
                      name: "Office Loans",
                      data: [2400, 2000, 2800, 2600, 2400, 2900],
                    },
                  ]}
                  categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                  colors={["#6366f1", "#0ea5e9"]}
                  yAxisWidth={60}
                  height={350}
                />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Loan Distribution</CardTitle>
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
      </Tabs>
    </div>
  );
};

export default FRMDashboard;
