
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Return } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, Plus, CheckCircle, RotateCcw, XCircle } from 'lucide-react';

const PurchaseReturnsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { returns, saveReturn, parties, loading } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filter for purchase returns only
  const purchaseReturns = returns
    .filter(ret => ret.type === 'purchase')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPartyName = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    return party ? party.name : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStatusChange = async (returnData: Return, newStatus: 'pending' | 'processed' | 'rejected') => {
    try {
      setProcessingId(returnData.id);
      await saveReturn({
        ...returnData,
        status: newStatus
      });
      
      const statusMessage = {
        'pending': 'marked as pending',
        'processed': 'processed successfully',
        'rejected': 'rejected'
      };
      
      toast({
        title: "Success",
        description: `Return ${statusMessage[newStatus]}`
      });
    } catch (error) {
      console.error('Error updating return status:', error);
      toast({
        title: "Error",
        description: "Failed to update return status",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Processed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Returns</h1>
          <p className="text-muted-foreground">Manage returns to suppliers</p>
        </div>
        <Button onClick={() => navigate('/purchase-returns/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Returns</CardTitle>
          <CardDescription>
            View and manage all returns to suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseReturns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseReturns.map((returnData) => (
                  <TableRow key={returnData.id}>
                    <TableCell>{returnData.returnNumber}</TableCell>
                    <TableCell>{formatDate(returnData.date)}</TableCell>
                    <TableCell>{getPartyName(returnData.partyId)}</TableCell>
                    <TableCell>{returnData.invoiceNumber || 'Direct Return'}</TableCell>
                    <TableCell className="text-right">₹{returnData.total.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{getStatusBadge(returnData.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={processingId === returnData.id}>
                            <span>Actions</span>
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/purchase-returns/${returnData.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          {returnData.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(returnData, 'processed')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Process Return
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(returnData, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Return
                              </DropdownMenuItem>
                            </>
                          )}
                          {returnData.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(returnData, 'pending')}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <RotateCcw className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No purchase returns</h3>
              <p className="text-muted-foreground mt-2">
                Create a new purchase return using the New Return button
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/purchase-returns/new')}
              >
                <Plus className="mr-2 h-4 w-4" /> New Return
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseReturnsListPage;
