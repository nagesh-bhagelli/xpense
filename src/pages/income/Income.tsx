import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Income = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    income_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const { data: incomeEntries, isLoading } = useQuery({
    queryKey: ['income', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user?.id)
        .order('income_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalIncome = incomeEntries?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('income').insert({
        user_id: user?.id,
        amount: parseFloat(data.amount),
        source: data.source,
        income_date: data.income_date,
        description: data.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add income');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('income')
        .update({
          amount: parseFloat(data.amount),
          source: data.source,
          income_date: data.income_date,
          description: data.description || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income updated successfully!');
      setEditingIncome(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update income');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete income');
    },
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      source: '',
      income_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.source) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (income: any) => {
    setEditingIncome(income);
    setFormData({
      amount: income.amount.toString(),
      source: income.source,
      income_date: income.income_date,
      description: income.description || '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      deleteMutation.mutate(id);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Income</h1>
          <p className="text-muted-foreground">Track your income sources</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingIncome} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingIncome(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="text-2xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input
                  id="source"
                  placeholder="e.g., Salary, Freelance, Investment"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.income_date}
                  onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this income..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingIncome ? 'Update' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingIncome(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            ${totalIncome.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading income entries...</div>
          ) : incomeEntries && incomeEntries.length > 0 ? (
            <div className="space-y-4">
              {incomeEntries.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-foreground">
                        {income.source}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(income.income_date), 'MMM dd, yyyy')}
                      {income.description && ` • ${income.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-primary">
                      ${Number(income.amount).toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(income)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(income.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No income entries yet. Add your first income!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Income;