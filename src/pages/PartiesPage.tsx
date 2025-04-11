
import React, { useState } from 'react';
import { Plus, Edit, Trash, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Party } from '@/lib/storage';

const PartyForm: React.FC<{
  party?: Party;
  onSave: (party: Party) => void;
  onClose: () => void;
}> = ({ party, onSave, onClose }) => {
  const [formData, setFormData] = useState<Party>(
    party || {
      id: '',
      name: '',
      type: 'customer',
      mobile: '',
      address: '',
      gst: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as 'customer' | 'supplier' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter party name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile</Label>
        <Input
          id="mobile"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          className={errors.mobile ? 'border-red-500' : ''}
        />
        {errors.mobile && <p className="text-sm text-red-500">{errors.mobile}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address"
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="gst">GST Number (Optional)</Label>
        <Input
          id="gst"
          name="gst"
          value={formData.gst || ''}
          onChange={handleChange}
          placeholder="Enter GST number"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Party</Button>
      </div>
    </form>
  );
};

const PartiesPage: React.FC = () => {
  const { parties, addParty, updateParty, removeParty } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredParties = parties.filter(
    (party) =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.mobile.includes(searchTerm) ||
      (party.gst && party.gst.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddParty = (party: Party) => {
    addParty(party);
    toast({
      title: 'Party Added',
      description: `${party.name} has been added successfully.`,
    });
  };

  const handleUpdateParty = (party: Party) => {
    updateParty(party);
    toast({
      title: 'Party Updated',
      description: `${party.name} has been updated successfully.`,
    });
  };

  const handleDeleteParty = (id: string) => {
    removeParty(id);
    setConfirmDelete(null);
    toast({
      title: 'Party Deleted',
      description: 'The party has been deleted successfully.',
    });
  };

  const openEditDialog = (party: Party) => {
    setSelectedParty(party);
    setOpenDialog(true);
  };

  const handleCreateInvoice = (partyId: string) => {
    navigate(`/invoices/new?partyId=${partyId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
          <p className="text-muted-foreground">Manage your customers and suppliers</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedParty(undefined)}>
              <Plus className="mr-2 h-4 w-4" /> Add Party
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedParty ? 'Edit Party' : 'Add New Party'}
              </DialogTitle>
            </DialogHeader>
            <PartyForm
              party={selectedParty}
              onSave={selectedParty ? handleUpdateParty : handleAddParty}
              onClose={() => setOpenDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parties..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredParties.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No parties found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding a customer or supplier'}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSelectedParty(undefined);
              setOpenDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Party
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>GST</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">{party.name}</TableCell>
                  <TableCell className="capitalize">{party.type}</TableCell>
                  <TableCell>{party.mobile}</TableCell>
                  <TableCell>{party.address}</TableCell>
                  <TableCell>{party.gst || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCreateInvoice(party.id)}
                        title="Create Invoice"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(party)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog open={confirmDelete === party.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setConfirmDelete(party.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Party</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to delete {party.name}? This action cannot be undone.</p>
                          <div className="flex justify-end space-x-2 pt-4">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDeleteParty(party.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PartiesPage;
