import { ServiceRequestStatus, ServiceType } from '../types/ServiceRequest';
import { UserRole } from '../contexts/AuthContext';

export const getStatusDisplayName = (status: ServiceRequestStatus): string => {
  switch (status) {
    case ServiceRequestStatus.CREATED: return 'Created';
    case ServiceRequestStatus.ASSIGNED: return 'Assigned';
    case ServiceRequestStatus.SCHEDULED: return 'Scheduled';
    case ServiceRequestStatus.IN_PROGRESS: return 'In Progress';
    case ServiceRequestStatus.PAYMENT_PENDING: return 'Payment Pending';
    case ServiceRequestStatus.COMPLETED: return 'Completed';
    case ServiceRequestStatus.CANCELLED: return 'Cancelled';
    default: return status;
  }
};

export const getStatusColor = (status: ServiceRequestStatus) => {
  switch (status) {
    case ServiceRequestStatus.CREATED: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    case ServiceRequestStatus.ASSIGNED: return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
    case ServiceRequestStatus.SCHEDULED: return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
    case ServiceRequestStatus.IN_PROGRESS: return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
    case ServiceRequestStatus.PAYMENT_PENDING: return { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' };
    case ServiceRequestStatus.COMPLETED: return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
    case ServiceRequestStatus.CANCELLED: return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
    default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
  }
};

export const getServiceTypeIcon = (type: ServiceType) => {
  switch (type) {
    case ServiceType.INSTALLATION: return 'construct';
    case ServiceType.MAINTENANCE: return 'settings';
    case ServiceType.REPAIR: return 'build';
    case ServiceType.REPLACEMENT: return 'swap-horizontal';
    default: return 'cog';
  }
};

export const getServiceTypeColor = (type: ServiceType) => {
  switch (type) {
    case ServiceType.INSTALLATION: return '#10B981';
    case ServiceType.MAINTENANCE: return '#3B82F6';
    case ServiceType.REPAIR: return '#EF4444';
    case ServiceType.REPLACEMENT: return '#8B5CF6';
    default: return '#6B7280';
  }
};

export const formatCurrency = (amount: number) => {
  return `₹${amount?.toLocaleString('en-IN')}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getAvailableTransitions = (
  request: any,
  currentStatus: ServiceRequestStatus,
  userRole: UserRole,
  validTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]>
): ServiceRequestStatus[] => {
  const possibleTransitions = validTransitions[currentStatus] || [];

  console.log('requsts is in transistions ',request)
  // Filter transitions based on user role
  return possibleTransitions.filter(transition => {
    // Only admins and franchise owners can assign agents
    if (transition === ServiceRequestStatus.ASSIGNED &&
      currentStatus === ServiceRequestStatus.CREATED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.FRANCHISE_OWNER) {
      return false;
    }

    // Only admins and franchise owners can reactivate cancelled requests
    if (currentStatus === ServiceRequestStatus.CANCELLED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.FRANCHISE_OWNER) {
      return false;
    }
    if (currentStatus === ServiceRequestStatus.IN_PROGRESS && request.type !== 'installation' && transition === ServiceRequestStatus.PAYMENT_PENDING) {
      return false

    }

    return true;
  });
};

export const requiresImageValidation = (
  fromStatus: ServiceRequestStatus,
  toStatus: ServiceRequestStatus,
  serviceType: ServiceType,
  beforeImages: string[],
  afterImages: string[]
): { valid: boolean; message?: string } => {
  // Starting IN_PROGRESS requires before images for installation
  if (toStatus === ServiceRequestStatus.IN_PROGRESS &&
    beforeImages.length === 0) {
    return { valid: false, message: 'Before images are required to start installation service' };
  }

  // Requesting payment requires after images
  if (toStatus === ServiceRequestStatus.PAYMENT_PENDING && afterImages.length === 0) {
    return { valid: false, message: 'After images are required to request payment' };
  }

  // Completing service (not from payment pending) requires after images
  if (toStatus === ServiceRequestStatus.COMPLETED &&
    fromStatus !== ServiceRequestStatus.PAYMENT_PENDING &&
    afterImages.length === 0) {
    return { valid: false, message: 'After images are required to complete service' };
  }

  return { valid: true };
};