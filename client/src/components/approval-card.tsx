import { ApprovalWithDetails } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ApprovalCardProps {
  approval: ApprovalWithDetails;
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const { toast } = useToast();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const formattedType = approval.type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const getApprovalDetails = () => {
    switch (approval.type) {
      case 'overtime':
        return `${approval.hours} hours overtime on ${new Date(approval.startDate!).toLocaleDateString()}`;
      case 'leave':
        return `Time off from ${new Date(approval.startDate!).toLocaleDateString()} to ${new Date(approval.endDate!).toLocaleDateString()}`;
      case 'reimbursement':
        return `$${approval.amount?.toFixed(2)} for ${approval.notes}`;
      default:
        return approval.notes || '';
    }
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/approvals/${approval.id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${formattedType} request approved`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve request: ${error}`,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/approvals/${approval.id}/reject`, {
        reason: rejectionReason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${formattedType} request rejected`,
      });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/approvals/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject request: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      rejectMutation.mutate();
    } else {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2 items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-yellow-100 text-yellow-800">
                {approval.employeeInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium text-neutral-500">{formattedType}</span>
              <h3 className="font-medium">{approval.employeeName}</h3>
            </div>
          </div>
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
        </div>
        <p className="text-sm text-neutral-400 mb-3">{getApprovalDetails()}</p>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsRejectDialogOpen(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            Deny
          </Button>
          <Button 
            size="sm" 
            onClick={handleApprove}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending ? "Approving..." : "Approve"}
          </Button>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {formattedType} Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request from {approval.employeeName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
