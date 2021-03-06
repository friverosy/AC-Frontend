import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Rx';

import { UserService } from '../../api/user/user.providers';
import { SectorService } from '../../api/sector/sector.providers';
import { PersonService, HUMANIZED_PERSON_PROFILES } from '../../api/person/person.providers';
import { CompanyService } from '../../api/company/company.providers';

import { Company }  from '../../api/company/company.model';
import { Sector }   from '../../api/sector/sector.model';
import { Register } from '../../api/register/register.model';
import { Person }   from '../../api/person/person.model';

import * as moment from 'moment';

@Component({
  selector: 'app-manual-register',
  templateUrl: './manual-register.component.html',
  styleUrls: ['./manual-register.component.css']
})
export class ManualRegisterComponent implements OnInit {
  activeSubscriptions = [];
  
  currentCompany: Company;
  currentSector: Sector;

  humanizedPersonProfiles = HUMANIZED_PERSON_PROFILES;
  
  // ngModel var for datepicker
  registerDateTime: any = moment().format("YYYY-MM-DD hh:mm");

  // list of candidates in searchBox and some searchBox statuses
  candidatePersons:Observable<Person[]>;
  selectedPerson: Person;
  isSearchBoxLoading:boolean = false;
  hasSearchBoxNoResults:boolean = false;
  
  searchBoxFormControl: FormControl    = new FormControl();
  rutFormControl: FormControl          = new FormControl({ value: '', disabled: true }, Validators.required);
  nameFormControl: FormControl         = new FormControl({ value: '', disabled: true }, Validators.required);
  personTypeFormControl: FormControl   = new FormControl({ value: '', disabled: true }, Validators.required);
  dateTimeFormControl: FormControl     = new FormControl({ value: null }, Validators.required);
  commentsFormControl: FormControl     = new FormControl('');
  
  manualRegisterForm: FormGroup = new FormGroup({
    searchBox:    this.searchBoxFormControl,
    rut:          this.rutFormControl,
    name:         this.nameFormControl,
    personType:   this.personTypeFormControl,
    dateTime:     this.dateTimeFormControl,
    comments:     this.commentsFormControl
  });

  // TODO: replace this with FormControls based solution
  selectedRegisterType: string =  'entry';

  constructor(private userService: UserService, private sectorService: SectorService, private companyService: CompanyService) {
  }

  ngOnInit() {
    this.candidatePersons = Observable.create((observer: any) => observer.next(this.searchBoxFormControl.value))
                                      .do(() => this.userService.currentCompany.subscribe(currentCompany => this.currentCompany = currentCompany))
                                      .mergeMap((currentRut: string) => this.companyService.getPersons(this.currentCompany, { rut: currentRut }));
    
    this.activeSubscriptions.push(
      this.userService.currentSector
        .subscribe(currentSector => this.currentSector = currentSector)
    );
  }

  searchBoxLoading(e: boolean): void {
    this.isSearchBoxLoading = e;
  }

  searchBoxNoResults(e: boolean): void {
    console.log(`searchBoxNoResults: ${this.hasSearchBoxNoResults}`);
    this.hasSearchBoxNoResults = e;
  }
  
  searchBoxOnSelect(e: any): void {
    console.log(`Selected Person: ${e.item}`);
    this.selectedPerson = <Person> e.item;
  }
  

  createRegister() {
    var newRegister = new Register();
    
    // creating new register... 
    newRegister.person   = this.selectedPerson;
    newRegister.comments = this.commentsFormControl.value;
    newRegister.type     = this.selectedRegisterType;
    
    if (this.selectedRegisterType === 'entry') {
      newRegister.time = moment(this.dateTimeFormControl.value).unix() * 1000;
    } else if (this.selectedRegisterType === 'depart') {
      newRegister.time = moment(this.dateTimeFormControl.value).unix() * 1000;
    }

    this.sectorService.createRegister(this.currentSector, newRegister).subscribe(createdRegister => {      
      this.manualRegisterForm.reset();
      
      this.selectedPerson       = null;
      this.selectedRegisterType = 'entry';
    }, (error) => {
      console.log(`error while creating register: ${error}`);
    });    
  }
  
  ngOnDestroy() {
    this.activeSubscriptions.forEach(s => s.unsubscribe());
  }
}
