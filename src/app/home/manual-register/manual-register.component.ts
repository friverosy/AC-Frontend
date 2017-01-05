import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Rx';

import { SectorService } from '../../api/sector/sector.providers';
import { RegisterService } from '../../api/register/register.providers';
import { PersonService } from '../../api/person/person.providers';

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
  currentSector: Sector;
  
  // ngModel var for datepicker
  registerDateTime: any;

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
  commentsFormControl: FormControl     = new FormControl('', Validators.required);
  
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

  constructor(private sectorService: SectorService, private registerService: RegisterService, private personService: PersonService) {
    console.log(`registerDateTime: ${this.registerDateTime}`);
    
    this.candidatePersons = Observable.create((observer: any) => observer.next(this.searchBoxFormControl.value))
                                      .mergeMap((currentRut: string) => this.personService.get({ rut: currentRut, sector: this.currentSector }));
  }

  ngOnInit() {
    this.sectorService.currentSector.subscribe(currentSector => this.currentSector = currentSector);
  }

  searchBoxLoading(e: boolean): void {
    this.isSearchBoxLoading = e;
  }

  searchBoxNoResults(e: boolean): void {
    this.hasSearchBoxNoResults = e;
  }
  
  searchBoxOnSelect(e: any): void {
    console.log(`Selected Person: ${e.item}`);
    this.selectedPerson = <Person> e.item;
  }
  

  createRegister() {
    console.log('Creating Register from Form...');
    var newRegister = new Register();
    
    // creating new register... 
    newRegister.person  = this.selectedPerson;
    newRegister.comment = this.commentsFormControl.value;
    
    if (this.selectedRegisterType === 'entry') {
      newRegister.sector = this.currentSector;
      newRegister.time   = moment(this.dateTimeFormControl.value).unix();
    } else if (this.selectedRegisterType === 'depart') {
      newRegister.sector = this.currentSector;
      newRegister.time   = moment(this.dateTimeFormControl.value).unix();
    }

    this.registerService.create(newRegister).subscribe(createdRegister => {
      console.log(`manual register created sucessfully: ${createdRegister}`);
      
      this.selectedPerson = null;
      this.selectedRegisterType = 'entry';
      this.manualRegisterForm.reset();
    }, (error) => {
      console.log(`error while creating register: ${error}`);
    });
    
  }

}
