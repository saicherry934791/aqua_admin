// Define the possible user types
export type UserType = 
  | 'guest'
  | 'superAdmin'
  | 'franchiseOwner'
  | 'serviceAgent';

// Define user permissions and access levels
export interface UserPermissions {
  dashboard: boolean;
  manage: {
    franchises?: boolean;
    products?: boolean;
    customers?: boolean;
  };
  orders: boolean;
  profile: boolean;
}

// Mapping of user types to their default permissions
export const UserTypePermissions: Record<UserType, UserPermissions> = {
  guest: {
    dashboard: false,
    manage: {},
    orders: false,
    profile: false,
  },
  superAdmin: {
    dashboard: true,
    manage: {
      franchises: true,
      products: true,
      customers: true,
    },
    orders: true,
    profile: true,
  },
  franchiseOwner: {
    dashboard: true,
    manage: {
      products: true,
      customers: true,
    },
    orders: true,
    profile: true,
  },
  serviceAgent: {
    dashboard: true,
    manage: {},
    orders: true,
    profile: true,
  }
}; 