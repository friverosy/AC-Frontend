import { Serializable } from '../utils/serializable';

import { Sector } from '../../api/sector/sector.model';
import { Company } from '../../api/company/company.model';

export class User extends Serializable {
  _id:  string;
  rut:  string;
  name: string;
  role: string;
  companies: Company[] = [];
      
  constructor() {
    super();  
  }
};