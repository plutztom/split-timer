import {HttpService} from './HttpService';
import {conf} from '../config';

export default class RunService {
  static GetRunDefinition(runDefinitionId){
    return HttpService.get(conf.api.getRunDefinition,
      {
        queryParams:{
          runDefinitionId: runDefinitionId
        }
      }).toPromise()
      .then((res) => {
        return res;
      });
  }
}