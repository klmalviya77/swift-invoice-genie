
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Return } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Printer, RotateCcw, Trash2, XCircle } from 'lucide-react';

const ReturnDetailsPage: React.FC = () => {
  const { returnId } = useParams<{ returnId: string }>();
  const navigate = useNavigate();
  const { returns, invoices, parties, saveReturn, removeReturn } = useApp();
  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (returnId) {
      const foundReturn = returns.find(ret => ret.id === returnId);
      setReturnData(foundReturn || null);
    }
    setLoading(false);
  }, [returnId, returns]);

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

  const handleStatusChange = async (newStatus: 'pending' | 'processed' | 'rejected') => {
    if (!returnData) return;
    
    try {
      await saveReturn({
        ...returnData,
        status: newStatus
      });
      
      setReturnData({
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
    }
  };

  const handleDelete = async () => {
    if (!returnData) return;
    
    try {
      await removeReturn(returnData.id);
      toast({
        title: "Success",
        description: "Return deleted successfully"
      });
      
      // Navigate based on return type
      if (returnData.type === 'purchase') {
        navigate('/purchase-returns');
      } else {
        navigate('/sales-returns');
      }
    } catch (error) {
      console.error('Error deleting return:', error);
      toast({
        title: "Error",
        description: "Failed to delete return",
        variant: "destructive"
      });
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

  const printReturn = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!returnData) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Return Not Found</h1>
        <p className="mb-4">The return you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const isPurchaseReturn = returnData.type === 'purchase';
  const partyLabel = isPurchaseReturn ? 'Supplier' : 'Customer';
  const backUrl = isPurchaseReturn ? '/purchase-returns' : '/sales-returns';
  const pageTitle = isPurchaseReturn ? 'Purchase Return Details' : 'Sales Return Details';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isPurchaseReturn ? 'Purchase' : 'Sales'} Returns
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            Return #{returnData.returnNumber} - {formatDate(returnData.date)}
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this return. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={printReturn}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Return Number</dt>
                <dd className="mt-1 text-sm">{returnData.returnNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm">{formatDate(returnData.date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{partyLabel}</dt>
                <dd className="mt-1 text-sm">{getPartyName(returnData.partyId)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Invoice</dt>
                <dd className="mt-1 text-sm">{returnData.invoiceNumber || 'Direct Return'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm">{getStatusBadge(returnData.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total</dt>
                <dd className="mt-1 text-sm font-bold">₹{returnData.total.toLocaleString('en-IN')}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return Actions</CardTitle>
            <CardDescription>
              Manage the status of this return
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {returnData.status === 'pending' && (
              <>
                <Button 
                  className="w-full"
                  onClick={() => handleStatusChange('processed')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Process Return
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleStatusChange('rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Return
                </Button>
              </>
            )}
            {returnData.status !== 'pending' && (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleStatusChange('pending')}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Mark as Pending
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnData.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex flex-col items-end">
            <div className="w-48 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{returnData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({returnData.gstPercentage}%):</span>
                <span>₹{returnData.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₹{returnData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        {returnData.notes && (
          <CardFooter>
            <div className="w-full">
              <h3 className="text-sm font-medium mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{returnData.notes}</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ReturnDetailsPage;
