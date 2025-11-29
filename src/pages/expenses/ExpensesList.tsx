import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

const ExpensesList = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', user?.id, categoryFilter, sortBy, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (dateFrom) {
        query = query.gte('expense_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('expense_date', dateTo);
      }

      const [field, direction] = sortBy.split('-');
      const ascending = direction === 'asc';

      if (field === 'date') {
        query = query.order('expense_date', { ascending });
      } else if (field === 'amount') {
        query = query.order('amount', { ascending });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete expense');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredExpenses = expenses?.filter((expense) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.description?.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      expense.payment_method?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">View and manage all your expenses</p>
        </div>
        <Link to="/expenses/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : filteredExpenses && filteredExpenses.length > 0 ? (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const category = categories?.find(c => c.name === expense.category);
                const Icon = category ? (Icons as any)[category.icon] : null;
                
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {category && (
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {Icon && <Icon className="h-5 w-5" style={{ color: category.color }} />}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-foreground">
                            {expense.description || 'No description'}
                          </div>
                          <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {expense.category}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                          {expense.payment_method && ` • ${expense.payment_method}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-foreground">
                        ${Number(expense.amount).toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/expenses/edit/${expense.id}`}>
                          <Button size="icon" variant="ghost">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses found. {searchQuery || categoryFilter !== 'all' ? 'Try adjusting your filters.' : 'Start tracking by adding your first expense!'}</p>
              <Link to="/expenses/add">
                <Button className="mt-4" variant="outline">
                  Add Your First Expense
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesList;
