import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AppService {
    constructor(private http: HttpClient) {
     }

    public getStates(): Observable<any> {
        return this.http.get('https://cdn-api.co-vin.in/api/v2/admin/location/states');
    }

    public getDistricts(data): Observable<any> {
        return this.http.get(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${data}`);
    }

    public getAvailableSlots(data, date): Observable<any> {
        return this.http.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${data.district.districtId}&date=${date}`);
    }

    public writeLocalStorage(data) {
        if(data){
            let requests: any = localStorage.getItem('requests');
            requests = requests ? JSON.parse(requests) : [];
            requests.push(data);
            localStorage.setItem('requests', JSON.stringify(requests));
        }
    }

    public readLocalStorage() {
        let requests: any = localStorage.getItem('requests');
        requests = requests ? JSON.parse(requests) : [];
        return requests;
    }

    public deleteLocalStorage(index) {
        let requests: any = localStorage.getItem('requests');
        requests = JSON.parse(requests);
        requests.splice(index, 1)
        localStorage.setItem('requests', JSON.stringify(requests));
    }
}