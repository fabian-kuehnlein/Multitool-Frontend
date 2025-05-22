import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SteamService {

  constructor() { }

  private SteamApiKey = "DAC33DB9F93134106683C03342F2BDBC"

  private steamUrl = "http://api.steampowered.com/<interface name>/<method name>/v<version>/?key=<api key>&format=<format>"
  private getUserParameter ="ISteamUser/GetPlayerSummaries/v0002/?key={SteamApiKey}";
}
