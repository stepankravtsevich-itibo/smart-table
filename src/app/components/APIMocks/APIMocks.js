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

          var result = TagRepo.data.slice(0);
          if(urlParams.orderBy){
            result = $filter('orderBy')(result, function(_sorted_object){
              return _sorted_object[urlParams.orderBy].value
            } , urlParams.reverse === "true" ? true : false);
          }
           result = $filter('limitTo')(result, urlParams.limit, urlParams.start);

          $log.log('Intercepted GET to listings', data);

          return [200, {
            data: result,
            count: TagRepo.data.length,
            numberOfPages: Math.ceil( TagRepo.data.length / result.length )
          }, {/*headers*/}];
        });

        //GET filters
        $httpBackend.whenGET(APIBase + 'filters').respond(function(method, url, data, headers) {


          // posible filters response
          var backand_stored_filters = [
            { "Shape": { "Round": "1", "Pear": "2", "Princess": "3", "Marquise": "4", "Emerald": "9", "Asscher \u0026 Sq. Emer": "17,5", "Sq. Emerald": "5", "Asscher": "17", "Oval": "7", "Radiant": "8", "Sq. Radiant": "35", "Trilliant": "10", "Heart": "11", "European Cut": "12", "Old Miner": "13", "Flanders": "14", "Cushion (all)": "15,16", "Cushion Brilliant": "15", "Cushion Modified": "16", "Baguette": "18", "Tapered Baguette": "34", "Kite": "19", "Star": "20", "Other": "21", "Half Moon": "22", "Trapezoid": "23", "Bullets": "24", "Hexagonal": "25", "Lozenge": "26", "Pentagonal": "27", "Rose": "28", "Shield": "29", "Square": "30", "Triangular": "31", "Briolette": "32", "Octagonal": "33", "Calf": "36", "Tapered Bullet": "37" } },
            { "Size": { "0.010-0.030": "100", "0.040-0.070": "110", "0.080-0.140": "120", "0.150-0.170": "130", "0.180-0.220": "140", "0.230-0.290": "150", "0.300-0.390": "160", "0.400-0.490": "170", "0.500-0.690": "180", "0.700-0.890": "190", "0.900-0.990": "200", "1.000-1.490": "210", "1.500-1.990": "220", "2.000-2.990": "230", "3.000-3.990": "240", "4.000-4.990": "250", "5.000-5.990": "260", "10.000-10.990": "300" } },
            {  "Lab": { "GIA": "1", "AGS": "4", "HRD": "5", "IGI": "2", "CGL (Japan)": "36", "DCLA": "7", "GCAL": "19", "GSI": "33", "NGTC": "32", "PGS": "6", "VGR": "9", "None": "16" } },
            {  "CutPolishSymmetry": { "Ideal": "1", "Excellent": "2", "Very Good": "3", "Good": "4", "Fair": "5", "Poor": "6", "None": "7" } },
            {  "FluorescenceIntensity": { "None": "1", "Very Slight": "2", "Faint / Slight": "3,7", "Medium": "4", "Strong": "5", "Very Strong": "6" } },
            {  "FluorescenceColor": { "Blue": "1", "Yellow": "2", "Green": "3", "Red": "4", "Orange": "5", "White": "6" } },
            {  "Country": { "USA": "100", "India": "200", "Israel": "300", "Belgium": "600", "Europe (EU)": "400", "Hong Kong": "700", "China": "800" } },
            {  "RapQualities": { "Rap Spec A1": "21", "Rap Spec A2": "24", "Rap Spec A3": "27", "Rap Spec A4": "28", "Rap Spec A5": "29", "Rap Spec B1": "31", "Rap Spec B2": "34", "Rap Spec B3": "37", "Rap Spec B4": "38", "Rap Spec B5": "39", "Rap Spec C1": "41", "Rap Spec C2": "44", "Rap Spec C3": "47", "Rap Spec C4": "48", "Rap Spec C5": "49" } },
            {  "Inclusions": { "None": "1", "Light": "2", "Medium": "3", "Heavy": "4" } },
            {  "Shade": { "none / white": "1", "No Brown": "4", "No Yellow": "3", "No Green": "5", "No Grey": "6", "No Black": "7", "No Pink": "8", "No Blue": "9" } },
            {  "Culet": { "None": "1", "Very Small": "5", "Small": "4", "Medium": "3", "Large": "2" } },
            {  "Girdle": { "Extr. Thin": "1", "Very Thin": "2", "Thin": "3", "Slightly Thin": "4", "Medium": "5", "Slightly Thick": "6", "Thick": "7", "Very Thick": "8", "Extr. Thick": "9" } }
          ];

          return [200, {
            data: backand_stored_filters,
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
