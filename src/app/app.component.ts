import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AppService } from 'src/app.service';

export interface DialogData {
  state: number;
  district: number;
  age: number;
  alert: string;
}

export interface State {
  stateId: number;
  stateName: string;
}

export interface District {
  districtId: number;
  districtName: string;
}

export interface Request {
  state: State;
  district: District;
  age: number;
  alert: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'vacAlert';
  states: State[];
  requests: Request[];
  startDate: any;
  endDate: any;
  dates: any;
  datesPicker: any;
  constructor(public dialog: MatDialog, private appService: AppService) {
    this.delete = this.delete.bind(this);
    this.states = [];
    const startDate = new Date();
    this.startDate = this.getDate(startDate);
    this.endDate = '1';
    this.appService.getStates().subscribe((states: any) => {
      this.states = states.states.map((item) => ({
        stateId: item.state_id,
        stateName: item.state_name,
      }));
      this.displayRequests();
    });
  }

  getDate(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const day = date.getDate();
    return `${day < 10 ? '0' + day : day}-${
      month + 1 < 10 ? '0' + (month + 1) : month
    }-${year}`;
  }

  displayRequests() {
    let requests = this.appService.readLocalStorage();
    if(requests.length === 0) {
      this.requests = requests;
      return;
    }
    let uniqueStates = Array.from(new Set(requests.map((item) => item.state)));
    let districtData = uniqueStates.map((item) =>
      this.appService.getDistricts(item)
    );
    forkJoin(districtData).subscribe((results) => {
      this.requests = requests.map((item) => {
        item.state = {
          stateId: item.state,
          stateName: this.states.find((state) => state.stateId === item.state) ? 
          this.states.find((state) => state.stateId === item.state).stateName : "Empty",
        };
        item.district = {
          districtId: item.district,
          districtName: results[
            uniqueStates.findIndex((state) => state === item.state.stateId)
          ].districts.length ?
          results[
            uniqueStates.findIndex((state) => state === item.state.stateId)
          ].districts.find((district) => district.district_id === item.district)
            .district_name : "Empty",
        };
        item.age = item.age;
        item.alert = item.alert;
        return item;
      });
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(InputDialog, {
      data: { state: 0, district: 0, age: 0, alert: '' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.appService.writeLocalStorage(result);
      this.displayRequests();
    });
  }

  delete(index) {
    this.appService.deleteLocalStorage(index);
    this.displayRequests();
  }

  view(data) {
    let dates = this.getAllDates(this.startDate, this.endDate);
    let allData = dates.map((item) =>
      this.appService.getAvailableSlots(data, item)
    );
    let consolidatedData = []
    forkJoin(allData).subscribe((days) => {
      for (let response of days) {
        response = response.centers
          ? response.centers.filter((item) => {
              item.sessions = item.sessions.filter(
                (session) =>
                  session.available_capacity > 0 &&
                  session.min_age_limit <= parseInt(data.age)
              );
              return item.sessions.length;
            })
          : [];
        consolidatedData = consolidatedData.concat(response);
      }
      const viewdialogRef = this.dialog.open(ViewDialog, {
        data: consolidatedData,
        height: '100vh',
        width: '100vw',
      });

      viewdialogRef.afterClosed().subscribe((result) => {});
    });
  }

  getAllDates(startDate, endDate) {
    let start = new Date(startDate.split('-').reverse().join('-'));
    let end = parseInt(endDate);
    let dates = [];
    for (let i = 0; i <= (end > 4 ? 4 : end); i++) {
      dates.push(this.getDate(start));
      start.setDate(start.getDate() + 7);
    }
    return dates;
  }
}

@Component({
  selector: 'dialog-component',
  templateUrl: 'dialog.component.html',
})
export class InputDialog {
  states: State[];
  districts: District[];
  age = new FormControl('', [Validators.required, Validators.pattern('')]);
  alert: string;
  constructor(
    public dialogRef: MatDialogRef<InputDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private appService: AppService
  ) {
    this.districts = [];
    this.states = [];
    this.appService.getStates().subscribe((states: any) => {
      this.states = states.states.map((item) => ({
        stateId: item.state_id,
        stateName: item.state_name,
      }));
    });
  }

  public getDistrictsForState(data) {
    this.appService.getDistricts(data.value).subscribe((districts: any) => {
      this.districts = districts.districts.map((item) => ({
        districtId: item.district_id,
        districtName: item.district_name,
      }));
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage() {
    if (this.age.hasError('required')) {
      return 'Please enter your age';
    }

    return this.age.hasError('pattern') ? 'Please enter a valid age' : '';
  }
}

@Component({
  selector: 'viewdialog-component',
  templateUrl: 'viewdialog.component.html',
})
export class ViewDialog {
  sessions: any[];
  constructor(
    public dialogRef: MatDialogRef<ViewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
