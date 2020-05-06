# @rxdi/http



### Installation

```bash
npm i @rxdi/http
```

```ts
import { Module } from '@rxdi/core';

@Module({
  imports: [
    HttpModule.forRoot({ url: 'http://localhost:9000/graphql' }),
  ]
})
export class AppModule {}
```


```ts
import { Injectable, Inject } from '@rxdi/core';
import { HttpClient, gql } from '@rxdi/http';
import { map } from 'rxjs/operators';


interface EnumGraphql {
  name: string;
  enumValues: {
    name: string;
    description: string;
    isDeprecated: boolean;
  }[];
}

interface Enums {
  instance_commands: EnumGraphql;
  worker_commands: EnumGraphql;
}

interface LinodeRegions {
  data: {
    country: string;
    id: string;
    status: string;
    capabilities: (string | 'Linodes' | 'NodeBalances' | 'Black Storage')[];
  }[];
  page: number;
  pages: number;
  results: number;
}

@Injectable()
export class GraphEnumsProvider {
  @Inject(HttpClient)
  private http: HttpClient;

  getEnums() {
    return this.http
      .query(
        gql`
          query {
            worker_commands: __type(name: "WorkerCommands") {
              name
              enumValues {
                name
                description
                isDeprecated
              }
            }
            instance_commands: __type(name: "InstanceCommands") {
              name
              enumValues {
                name
                description
                isDeprecated
              }
            }
          }
        `
      )
      .pipe(map(({ data }) => data as Enums));
  }

  getLinodeRegions() {
    return this.http.get<LinodeRegions>('https://api.linode.com/v4/regions');
  }

  getLinodeRegionsKeys() {
    return this.getLinodeRegions().pipe(map(i => i.data.map(r => r.id)));
  }
}
```