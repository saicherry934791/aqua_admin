export enum ServiceRequestStatus {
    CREATED = 'CREATED',
    ASSIGNED = 'ASSIGNED',
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
  }
  
  export enum ServiceType {
    INSTALLATION = 'installation',
    MAINTENANCE = 'maintenance',
    REPAIR = 'repair',
    REPLACEMENT = 'replacement',
  }
  
  export interface ServiceRequest {
    id: string;
    customerId: string;
    productId: string;
    type: ServiceType;
    description: string;
    status: ServiceRequestStatus;
    images: string[];
    assignedAgent: {
      id: string;
      name: string;
      phone: string;
    } | null;
    franchiseId: string;
    scheduledDate: string | null;
    beforeImages: string[];
    afterImages: string[];
    requirePayment: boolean;
    paymentAmount: number | null;
    createdAt: string;
    updatedAt: string;
    completedDate?: string;
    customer: {
      id: string;
      name: string;
      phone: string;
    };
    product: {
      id: string;
      name: string;
      model: string;
    };
    paymentStatus?: {
      status: 'PENDING' | 'COMPLETED' | 'FAILED';
      amount: number;
      method?: string;
      paidDate?: string;
      razorpayPaymentLink?: string;
      razorpaySubscriptionId?: string;
    };
  }
  
  export const validTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
    [ServiceRequestStatus.CREATED]: [ServiceRequestStatus.ASSIGNED, ServiceRequestStatus.CANCELLED],
    [ServiceRequestStatus.ASSIGNED]: [ServiceRequestStatus.SCHEDULED, ServiceRequestStatus.CANCELLED],
    [ServiceRequestStatus.SCHEDULED]: [ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.CANCELLED],
    [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.PAYMENT_PENDING, ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED],
    [ServiceRequestStatus.PAYMENT_PENDING]: [ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED],
    [ServiceRequestStatus.COMPLETED]: [], // Cannot transition from completed
    [ServiceRequestStatus.CANCELLED]:[]
    // [ServiceRequestStatus.CANCELLED]: [ServiceRequestStatus.ASSIGNED, ServiceRequestStatus.SCHEDULED] // Can be reactivated
  };