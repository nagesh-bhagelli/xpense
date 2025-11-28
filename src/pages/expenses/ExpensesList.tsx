import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const ExpensesList = () => {
  const { user, loading } = useAuth();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
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
                  <div className="text-lg font-bold text-foreground">
                    ${Number(expense.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses yet. Start tracking by adding your first expense!</p>
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
