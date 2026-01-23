// auth.model.ts

export interface IhanoiLoginResponse {
    token_type: string;
    access_token: string;
    identity_token: string;
    user: IhanoiUser;
  }
  
  export interface IhanoiUser {
    id: number;
    user_sso_id: number;
    email: string;
    department_id: number;
    staff_code: string;
    fullname: string;
    firstname: string;
    lastname: string;
    username: string;
    status: 'ACTIVE' | 'INACTIVE';
    address: string | null;
    city: string | null;
    state: string | null;
    postal: string | null;
    country: string;
    phone: string;
    fax: string | null;
    cell: string | null;
    phone2: string | null;
    unit_code: string | null;
    province_code: string | null;
    province_alias: string | null;
    title: string | null;
    birthdate: string;
    timezone: string;
    datetime_format: string;
    language: string;
    is_administrator: boolean;
    page_id: number | null;
    expires_at: string | null;
    loggedin_at: string;
    gender: number;
    ethnicity: string | null;
    addr_no: string | null;
    street: string | null;
    ward: string | null;
    district: string | null;
    province: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    data_domain_id: number | null;
    identification_no: string;
    temp_address: string | null;
    temp_ward: string | null;
    temp_district: string | null;
    temp_province: string | null;
    number_of_failure: number;
    password_expire_notified_at: string | null;
    place_id: string;
    is_super_administrator: boolean;
    avatar: string;
    badge: number;
    last_password_refresh: string | null;
    position: string;
    gapo_id: string;
  
    address_info: {
      province: string | null;
      district: string | null;
      ward: string | null;
      temp_province: string | null;
      temp_district: string | null;
      temp_ward: string | null;
    };
  
    place_info: {
      id: number;
      name: string;
      short_name: string;
      parent_id: number | null;
      lat: number | null;
      lng: number | null;
      code: string;
    };
  
    department_place_info: {
      id: number;
      name: string;
      short_name: string;
      parent_id: number | null;
      lat: number | null;
      lng: number | null;
      code: string;
    };
  
    department: string;
    group: number[];
    require_password_change: boolean;
    is_new: boolean;
    roles: string[];
  }
  