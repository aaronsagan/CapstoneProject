import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Coins, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CustomChartTooltip } from "@/components/ui/enhanced-tooltip";

interface Transaction {
  id: number;
  type: 'donation' | 'disbursement';
  amount: number;
  charity_name: string;
  campaign_name?: string;
  donor_name?: string;
  date: string;
  status: string;
  purpose?: string;
  reference_number?: string;
}

interface Statistics {
  total_donations: number;
  total_disbursements: number;
  net_flow: number;
  transaction_count: number;
}

interface ChartDataPoint {
  name: string;
  donations: number;
  disbursements: number;
  count?: number;
}

export default function FundTracking() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_donations: 0,
    total_disbursements: 0,
    net_flow: 0,
    transaction_count: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  const [showDonationsInfo, setShowDonationsInfo] = useState(false);
  const [showDisbursementsInfo, setShowDisbursementsInfo] = useState(false);
  const [showNetFlowInfo, setShowNetFlowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [timeRange]);

  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsResponse = await axios.get(
        `/admin/fund-tracking/statistics?days=${timeRange}`
      );
      setStatistics(statsResponse.data);

      // Fetch transactions
      const transactionsResponse = await axios.get(
        `/admin/fund-tracking/transactions?days=${timeRange}`
      );
      setTransactions(transactionsResponse.data.transactions || []);

      // Fetch chart data
      const chartResponse = await axios.get(
        `/admin/fund-tracking/chart-data?days=${timeRange}`
      );
      setChartData(chartResponse.data.chart_data || []);

    } catch (error) {
      console.error('Failed to fetch fund tracking data:', error);
      toast.error('Failed to load fund tracking data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.charity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (tx.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = filterType === "all" || tx.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const pieData = [
    { name: 'Donations', value: statistics.total_donations, color: '#10b981' },
    { name: 'Disbursements', value: statistics.total_disbursements, color: '#ef4444' },
  ];

  const handleExport = async () => {
    try {
      const response = await axios.get(
        `/admin/fund-tracking/export?days=${timeRange}`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fund_tracking_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading fund tracking data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-0">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">Fund Tracking</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-base">Monitor donation flows and disbursements</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="w-full sm:w-auto sm:flex-1">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:grid-cols-none sm:flex sm:flex-row">
          <Button onClick={fetchTransactions} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="default" size="sm" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-2 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full min-w-0"
        >
          <Card onClick={() => setShowDonationsInfo(true)} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background cursor-pointer w-full max-w-full overflow-hidden box-border">
            <CardHeader className="pb-1 sm:pb-3 w-full">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate w-full">Total Donations</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 truncate">
                    ₱{statistics.total_donations.toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="h-3 w-3 text-green-600 shrink-0" />
                    <span className="truncate">+12.5% from last period</span>
                  </p>
                </div>
                <Coins className="h-5 w-5 sm:h-7 sm:w-7 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full min-w-0"
        >
          <Card onClick={() => setShowDisbursementsInfo(true)} className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-background cursor-pointer w-full max-w-full overflow-hidden box-border">
            <CardHeader className="pb-1 sm:pb-3 w-full">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate w-full">Total Disbursements</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 truncate">
                    ₱{statistics.total_disbursements.toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <ArrowDownRight className="h-3 w-3 text-red-600 shrink-0" />
                    <span className="truncate">+8.3% from last period</span>
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-red-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full min-w-0"
        >
          <Card onClick={() => setShowNetFlowInfo(true)} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background cursor-pointer w-full max-w-full overflow-hidden box-border">
            <CardHeader className="pb-1 sm:pb-3 w-full">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate w-full">Net Flow</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${statistics.net_flow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ₱{Math.abs(statistics.net_flow).toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                    {statistics.net_flow >= 0 ? 'Positive' : 'Negative'} balance
                  </p>
                </div>
                <PieChart className="h-5 w-5 sm:h-7 sm:w-7 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full min-w-0"
        >
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background w-full max-w-full overflow-hidden box-border">
            <CardHeader className="pb-1 sm:pb-3 w-full">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate w-full">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 truncate">
                    {statistics.transaction_count}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                    Total transactions
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-2 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 w-full max-w-full">
        <Card className="w-full min-w-0 overflow-hidden">
          <CardHeader className="w-full">
            <CardTitle className="text-base sm:text-lg truncate w-full">Transaction Trends</CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words w-full">Donations vs Disbursements over time</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="w-full overflow-hidden px-2 sm:px-0">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No transaction data available</p>
                  <p className="text-xs mt-2">Data will appear once donations are confirmed</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomChartTooltip type="funds" valuePrefix="₱" />} />
                  {!isMobile && <Legend wrapperStyle={{ fontSize: '12px' }} />}
                  <Line type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={2} name="Donations" />
                  <Line type="monotone" dataKey="disbursements" stroke="#ef4444" strokeWidth={2} name="Disbursements" />
                </LineChart>
              </ResponsiveContainer>
            )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 max-w-full overflow-hidden box-border">
          <CardHeader className="w-full">
            <CardTitle className="text-base sm:text-lg truncate w-full">Fund Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words w-full">Breakdown of donations and disbursements</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="w-full overflow-hidden px-2 sm:px-0">
            {statistics.total_donations === 0 && statistics.total_disbursements === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No fund distribution data</p>
                  <p className="text-xs mt-2">Chart will show once donations are made</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                      return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip type="funds" valuePrefix="₱" />} />
                </RePieChart>
              </ResponsiveContainer>
            )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="w-full min-w-0 max-w-full overflow-hidden box-border">
        <CardHeader className="w-full">
          <CardTitle className="text-base sm:text-lg truncate w-full">Recent Transactions</CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words w-full">All financial transactions across the platform</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden sm:overflow-x-auto">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="donation">Donations</SelectItem>
                  <SelectItem value="disbursement">Disbursements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <motion.div
                    key={`${tx.id}-${tx.reference_number || ''}-${tx.date}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50 bg-card gap-3 overflow-hidden"
                  >
                    <div className="flex items-start gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className={`p-2 sm:p-3 rounded-full shrink-0 ${
                        tx.type === 'donation' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                      }`}>
                        {tx.type === 'donation' ? (
                          <ArrowUpRight className={`h-4 w-4 sm:h-5 sm:w-5 text-green-600`} />
                        ) : (
                          <ArrowDownRight className={`h-4 w-4 sm:h-5 sm:w-5 text-red-600`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{tx.charity_name}</h4>
                          <Badge variant={tx.type === 'donation' ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {tx.type}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {tx.campaign_name && `${tx.campaign_name} • `}
                          {tx.donor_name && `From ${tx.donor_name} • `}
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
                      <div className={`text-lg sm:text-xl font-bold ${
                        tx.type === 'donation' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'donation' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Dialogs */}
      <Dialog open={showDonationsInfo} onOpenChange={setShowDonationsInfo}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <span className="truncate">Total Donations Summary</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Complete breakdown of all donation inflows for the selected period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 break-words">
                ₱{statistics.total_donations.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total donations received</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📊</span> Computation Method
                </h4>
                <div className="p-3 rounded-md bg-muted/50 text-sm space-y-1">
                  <p className="font-mono">SUM(donations.amount)</p>
                  <p className="text-muted-foreground">WHERE status = 'completed'</p>
                  <p className="text-muted-foreground">AND donated_at BETWEEN (today - {timeRange} days) AND today</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📝</span> Explanation
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This represents the total monetary value of all successfully completed donations within the last <strong>{timeRange} days</strong>. 
                  Only donations with 'completed' status are included to ensure accuracy. Pending or rejected donations are excluded from this calculation.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisbursementsInfo} onOpenChange={setShowDisbursementsInfo}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <span className="truncate">Total Disbursements Summary</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Complete breakdown of all fund usage and outflows for the selected period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 break-words">
                ₱{statistics.total_disbursements.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total funds disbursed</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📊</span> Computation Method
                </h4>
                <div className="p-3 rounded-md bg-muted/50 text-sm space-y-1">
                  <p className="font-mono">SUM(fund_usage_logs.amount)</p>
                  <p className="text-muted-foreground">WHERE spent_at BETWEEN (today - {timeRange} days) AND today</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📝</span> Explanation
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This represents the total amount of funds that have been used or disbursed by charities within the last <strong>{timeRange} days</strong>. 
                  This includes all recorded fund usage logs where charities have documented how they spent the donated funds on their campaigns and programs.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNetFlowInfo} onOpenChange={setShowNetFlowInfo}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span className="truncate">Net Flow Summary</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Net flow indicates the balance between donations received and funds disbursed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className={`p-3 sm:p-4 rounded-lg border ${
              statistics.net_flow >= 0 
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
            }`}>
              <div className={`text-2xl sm:text-3xl font-bold mb-1 break-words ${
                statistics.net_flow >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {statistics.net_flow >= 0 ? '+' : '-'}₱{Math.abs(statistics.net_flow).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                {statistics.net_flow >= 0 ? 'Positive balance (surplus)' : 'Negative balance (deficit)'}
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📊</span> Computation Method
                </h4>
                <div className="p-3 rounded-md bg-muted/50 text-sm space-y-2">
                  <p className="font-mono text-center py-2 bg-background rounded">
                    Net Flow = Total Donations − Total Disbursements
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-muted-foreground">Donations</p>
                      <p className="font-semibold text-green-600">₱{statistics.total_donations.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs text-muted-foreground">Disbursements</p>
                      <p className="font-semibold text-red-600">₱{statistics.total_disbursements.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">📝</span> Explanation
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Net flow represents the difference between total donations received and total funds disbursed within the last <strong>{timeRange} days</strong>. 
                  A <strong className="text-blue-600">positive net flow</strong> indicates more donations were received than disbursed (surplus), 
                  while a <strong className="text-orange-600">negative net flow</strong> indicates more funds were disbursed than received (deficit).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">💡 Note</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This calculation only includes completed donations and recorded disbursements within the selected time period. 
                  Pending donations are not included in this calculation.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
