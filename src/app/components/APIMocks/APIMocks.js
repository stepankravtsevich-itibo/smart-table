'use strict';

angular.module('APIMocks', [])
    .constant('Config', {
        API: {
            useMocks:           true,
            fakeDelay:          1000,
            protocol:           'http',
            host:               'some-awesome-backand',
            port:               3000,
            path:               '/api',
        }
    })
    .config(function(Config, $provide) {
        //Decorate backend with awesomesauce
        if(Config.API.useMocks) $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
    })
    .config(function ($httpProvider, Config) {
        if(!Config.API.useMocks) return;

        $httpProvider.interceptors.push(function ($q, $timeout, Config, $log) {
            return {
                'request': function (config) {
                    if(config.url.indexOf(Config.API.protocol + '://' + Config.API.host + ':' + Config.API.port  + Config.API.path + '/') == 0)
                      $log.log('Requesting ' + config.url, config);
                    return config;
                },
                'response': function (response) {
                    var deferred = $q.defer();

                    if(response.config.url.indexOf(Config.API.path) !== 0) return response; //Let through views immideately
                    //Fake delay on response from APIs and other urls
                    $log.log('Delaying response with ' + Config.API.fakeDelay + 'ms');
                    $timeout(function () {
                        deferred.resolve(response);
                    }, Config.API.fakeDelay);

                    return deferred.promise;
                }

            }
        })

    })
    .factory('APIBase', function (Config) {
        return (Config.API.protocol + '://' + Config.API.host + ':' + Config.API.port  + Config.API.path + '/');
    })
    .constant('regexEscape', function regEsc(str) {
        //Escape string to be able to use it in a regular expression
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    })
    .run(function (Config, $httpBackend, $log, APIBase, $timeout, regexEscape, $filter) {
        //Only load mocks if config says so
        if(!Config.API.useMocks) return;

        var collectionUrl = APIBase + 'listings';

        var IdRegExp = /[\d\w-_]+$/.toString().slice(1, -1);
        var QueryRegExp = /[\d\w-_\.%\s]*$/.toString().slice(1, -1);

        var id = 0;

        var TagRepo = {};
        TagRepo.data = [];

        for (var i = 0; i < 400; i++) {
          TagRepo.data.push(createRandomItem(i));
        }

        TagRepo.index = {};

        angular.forEach(TagRepo.data, function(item, key) {
            TagRepo.index[item.id] = item; //Index messages to be able to do efficient lookups on id
        });

        //GET listings/
        $httpBackend.whenGET(new RegExp(regexEscape(collectionUrl) + '(\\?.*$)?' )).respond(function(method, url, data, headers) {

          //default
          var urlParams = {
            start: 0,
            limit: 10
          }

          try{
            var terms = url.match( new RegExp(regexEscape(collectionUrl) + '(\\?.*$)?') )[1].slice(1) || '';
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            while (match = search.exec(terms)){
              urlParams[decode(match[1])] = decode(match[2]);
            }
          } catch (e){
            // oops
          }

          // var result = TagRepo.data.slice(urlParams.start, urlParams.limit);
          var result = $filter('limitTo')(TagRepo.data, urlParams.limit, urlParams.start);

          $log.log('Intercepted GET to listings', data);

          return [200, {
            data: result,
            count: TagRepo.data.length,
            numberOfPages: Math.ceil( TagRepo.data.length / result.length )
          }, {/*headers*/}];
        });

        // //GET tag/<id>
        // $httpBackend.whenGET( new RegExp(regexEscape(collectionUrl + '/') + IdRegExp ) ).respond(function(method, url, data, headers) {
        //     $log.log('Intercepted GET to tag/id');
        //     var id = url.match( new RegExp(IdRegExp) )[0];
        //
        //     var Tag = TagRepo.index[id];
        //
        //     if (!Tag) {
        //         return [404, {} , {/*headers*/}];
        //     }
        //
        //
        //     return [200, Tag, {/*headers*/}];
        // });
        //
        // //POST tag/
        // $httpBackend.whenPOST(collectionUrl).respond(function(method, url, data, headers) {
        //     $log.log('Intercepted POST to tag', data);
        //     var Tag = angular.fromJson(data);
        //
        //     Tag.id = id++;
        //     TagRepo.data.push(Tag);
        //     TagRepo.index[Tag.id] = Tag;
        //
        //     return [200, Tag, {/*headers*/}];
        // });
        //
        // //GET tag/search?q=<query>
        // $httpBackend.whenGET( new RegExp(regexEscape(collectionUrl + '/search?q=') + QueryRegExp ) ).respond(function(method, url, data, headers) {
        //     $log.log('Intercepted GET to tag/search');
        //     var term = url.match( new RegExp(QueryRegExp) )[0] || '';
        //
        //     var hits = TagRepo.data.filter(function (tag) {
        //         return tag && typeof tag.text == 'string' && tag.text.toLowerCase().indexOf(term.toLowerCase()) >= 0;
        //     });
        //
        //     return

        // //PUT tag/<id>
        // $httpBackend.whenPUT( new RegExp(regexEscape(collectionUrl + '/') + IdRegExp ) ).respond(function(method, url, data, headers) {
        //     $log.log('Intercepted PUT to tag');
        //     var id = url.match( new RegExp(IdRegExp) )[0];
        //
        //     if (!TagRepo.index[id]) {
        //         return [404, {} , {/*headers*/}];
        //     }
        //
        //     var Tag = TagRepo.index[id] = angular.fromJson(data);
        //
        //     return [200, Tag, {/*headers*/}];
        // });
        //
        // //DELETE tag/<id>
        // $httpBackend.whenDELETE( new RegExp(regexEscape(collectionUrl + '/') + IdRegExp ) ).respond(function(method, url, data, headers) {
        //     $log.log('Intercepted DELETE to tag');
        //     var id = url.match( new RegExp(IdRegExp) )[0];
        //
        //     var Tag = TagRepo.index[id];
        //
        //     if (!Tag) {
        //         return [404, {} , {/*headers*/}];
        //     }
        //
        //     delete TagRepo.index[Tag.id];
        //
        //     var index = TagRepo.data.indexOf(Tag);
        //     TagRepo.data.splice(index, 1);
        //
        //     return [200, Tag , {/*headers*/}];
        // });

        $httpBackend.whenGET(/\/*/).passThrough();

        function createRandomItem(id) {
          var colors = ["A", "B", "C", "D", "E", "F"];
          var clarities = ["IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2"];
          var statuses = ["Active", "Suspended"];

          return {
            lot: { label: 'Lot', name: 'lot', value: 100000000 + id },
            stock: { label: 'Stock', name: 'stock', value: 100000000 + id },
            date: { label: 'Date', name: 'date', type: 'date', value: 1420049704202 },
            shape: { label: 'Shape', name: 'shape', value: 'ROUND' },
            size: { label: 'Size', name: 'size', value: (Math.random() * 10).toFixed(2) },
            color: { label: 'Color', name: 'color', value: colors[Math.floor(Math.random() * (colors.length - 0)) + 0] },
            clarity: { label: 'Clarity', name: 'clarity',  value: clarities[Math.floor(Math.random() * (clarities.length)) + 0] },
            cut: { label: 'Cut', name: 'cut', value: 'Ideal' },
            lab: { label: 'Lab', name: 'lab', value: 'GiA' },
            price: { label: 'Price: $/CT', name: 'price', type: 'currency', value: 14720 },
            price_rap: { label: 'Price Rap %', name: 'price_rap', type: 'number', value: '-46' },
            cash: { label: 'Cash: $/CT', name: 'cash', type: 'currency', value: 14720 },
            cash_rap: { label: 'Cash Rap %', name: 'cash_rap', type: 'number', value: '-46' },
            raplist: { label: 'Raplist', name: 'raplist', type: 'currency', value: 14720 },
            total: { label: 'Total', name: 'total', type: 'currency', value: 14720 },
            status: { label: 'Status', name: 'status', value: statuses[Math.round(Math.random())] }
        }
      }
    });
