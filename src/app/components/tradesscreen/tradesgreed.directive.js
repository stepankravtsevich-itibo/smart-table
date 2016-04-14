(function() {
  'use strict';

  angular
    .module('tradesscreen')
    .directive('tradesGreed', tradesGreed)
    .directive('advancedFilters', advancedFilters)
    .directive('csSelect', csSelect)
    .directive('stSelectAll', stSelectAll)
    .directive('advancedFilterItem', advancedFilterItem);

    function tradesGreed() {
      return {
        templateUrl: 'app/components/tradesscreen/tradesgreed.html',
        scope: {
            startFrom: '=',
            itemsNumber: '=',
            rowsSelected: '='
        },
        controller: tradesGreedController,
        controllerAs: 'vm',
        bindToController: true
      };

      /** @ngInject */
      function tradesGreedController($scope, tradesScreenService, $filter) {
        var self = this;
        this.itemsByPage = 10;
        this.displayed = [];

        this.updateSelected = function(){
          self.rowsSelected = self.displayed.filter(function(item){
            return item.isSelected === true;
          });
        }

        this.callServer = function (table_params){
          self.isLoading = true;

          if (table_params){
            tradesScreenService.getListings(table_params).then(
              function(result){
                self.table_columns = [];
                self.displayed = [];

                self.startFrom = table_params.pagination.start;
                self.itemsNumber = table_params.pagination.number;

                angular.forEach(Object.keys(result.data[0]), function(field_name){
                  self.table_columns.push({name: field_name, label: result.data[0][field_name]['label']})
                })

                angular.forEach(result.data, function(column_obj){
                  var row_obj = {};
                  angular.forEach(Object.keys(column_obj), function(key){
                    row_obj[key] = column_obj[key].type
                      ? $filter(column_obj[key].type)(column_obj[key].value)
                      : column_obj[key].value
                    // row_obj[key] = column_obj[key].value
                  })
                  self.displayed.push(row_obj)
                })

                table_params.pagination.numberOfPages = result.numberOfPages;
                self.isLoading = false;
              },
              function(error){
                console.log("error response: %O", error);
                self.isLoading = false;
              }
            );
          }
        }

        this.callServer();
      }
    }

    function advancedFilters(){
      return {
        templateUrl: 'app/components/tradesscreen/advancedFilters.html',
        scope: {},
        controller: advancedFiltersController,
        controllerAs: 'vm',
        bindToController: true
      };

      /** @ngInject */
      function advancedFiltersController(FiltersService) {
        var self = this;
        this.advanced_filters = [];

        FiltersService.get(
          function(result){
            self.advanced_filters = filters_postprocessing(result.data);
          },
          function(error){
            console.log("error filter result: %O", error)
          }
        );

        // posible filters response
        // {
        //   "Shape": { "Round": "1", "Pear": "2", "Princess": "3", "Marquise": "4", "Emerald": "9", "Asscher \u0026 Sq. Emer": "17,5", "Sq. Emerald": "5", "Asscher": "17", "Oval": "7", "Radiant": "8", "Sq. Radiant": "35", "Trilliant": "10", "Heart": "11", "European Cut": "12", "Old Miner": "13", "Flanders": "14", "Cushion (all)": "15,16", "Cushion Brilliant": "15", "Cushion Modified": "16", "Baguette": "18", "Tapered Baguette": "34", "Kite": "19", "Star": "20", "Other": "21", "Half Moon": "22", "Trapezoid": "23", "Bullets": "24", "Hexagonal": "25", "Lozenge": "26", "Pentagonal": "27", "Rose": "28", "Shield": "29", "Square": "30", "Triangular": "31", "Briolette": "32", "Octagonal": "33", "Calf": "36", "Tapered Bullet": "37" },
        //   "Size": { "0.010-0.030": "100", "0.040-0.070": "110", "0.080-0.140": "120", "0.150-0.170": "130", "0.180-0.220": "140", "0.230-0.290": "150", "0.300-0.390": "160", "0.400-0.490": "170", "0.500-0.690": "180", "0.700-0.890": "190", "0.900-0.990": "200", "1.000-1.490": "210", "1.500-1.990": "220", "2.000-2.990": "230", "3.000-3.990": "240", "4.000-4.990": "250", "5.000-5.990": "260", "10.000-10.990": "300" },
        //   "Lab": { "GIA": "1", "AGS": "4", "HRD": "5", "IGI": "2", "CGL (Japan)": "36", "DCLA": "7", "GCAL": "19", "GSI": "33", "NGTC": "32", "PGS": "6", "VGR": "9", "None": "16" },
        //   "CutPolishSymmetry": { "Ideal": "1", "Excellent": "2", "Very Good": "3", "Good": "4", "Fair": "5", "Poor": "6", "None": "7" },
        //   "FluorescenceIntensity": { "None": "1", "Very Slight": "2", "Faint / Slight": "3,7", "Medium": "4", "Strong": "5", "Very Strong": "6" },
        //   "FluorescenceColor": { "Blue": "1", "Yellow": "2", "Green": "3", "Red": "4", "Orange": "5", "White": "6" },
        //   "Country": { "USA": "100", "India": "200", "Israel": "300", "Belgium": "600", "Europe (EU)": "400", "Hong Kong": "700", "China": "800" },
        //   "RapQualities": { "Rap Spec A1": "21", "Rap Spec A2": "24", "Rap Spec A3": "27", "Rap Spec A4": "28", "Rap Spec A5": "29", "Rap Spec B1": "31", "Rap Spec B2": "34", "Rap Spec B3": "37", "Rap Spec B4": "38", "Rap Spec B5": "39", "Rap Spec C1": "41", "Rap Spec C2": "44", "Rap Spec C3": "47", "Rap Spec C4": "48", "Rap Spec C5": "49" },
        //   "Inclusions": { "None": "1", "Light": "2", "Medium": "3", "Heavy": "4" },
        //   "Shade": { "none / white": "1", "No Brown": "4", "No Yellow": "3", "No Green": "5", "No Grey": "6", "No Black": "7", "No Pink": "8", "No Blue": "9" },
        //   "Culet": { "None": "1", "Very Small": "5", "Small": "4", "Medium": "3", "Large": "2" },
        //   "Girdle": { "Extr. Thin": "1", "Very Thin": "2", "Thin": "3", "Slightly Thin": "4", "Medium": "5", "Slightly Thick": "6", "Thick": "7", "Very Thick": "8", "Extr. Thick": "9" }
        // };

        function filters_postprocessing(original){
          var result = [];
          angular.forEach(original, function(filter_item){
            var _obj = {
              name: Object.keys(filter_item)[0],
              type: 'select'
            };
            angular.extend(_obj, {
              values: Object.keys(filter_item[_obj.name])
                  .map( function (key) {
                    return {
                      label: key + ' ( ' + filter_item[_obj.name][key] + ' )',
                      id: filter_item[_obj.name][key]
                    }
                  })
            })

            result.push(_obj)
          })
          console.log(result);
          return result;
        }

      }
    }

    function csSelect() {
        return {
            require: ['^stTable', '^^tradesGreed'],
            template: '<input type="checkbox" ng-model="checked"/>',
            scope: {
                row: '=csSelect'
            },
            link: function (scope, element, attr, controllers) {
              var table_ctrl = controllers[0],
                  trade_screen_ctrl = controllers[1];

              element.bind('change', function (evt) {
                  scope.$apply(function () {
                    table_ctrl.select(scope.row, 'multiple');
                  });
              });

              scope.$watch('row.isSelected', function (newValue, oldValue) {
                if (newValue === true) {
                  element.parent().addClass('st-selected');
                  scope.checked = true;
                } else {
                  element.parent().removeClass('st-selected');
                  scope.checked = false;
                }

                trade_screen_ctrl.updateSelected();
              });
            }
        };
    }

    function stSelectAll(){
      return {
        restrict: 'E',
        template: '<input type="checkbox" ng-model="isAllSelected" />',
        scope: {
          all: '='
        },
        link: function (scope, element, attr) {

          scope.$watch('isAllSelected', function () {
            scope.all.forEach(function (val) {
              val.isSelected = scope.isAllSelected;
            })
          });

          scope.$watch('all', function (newVal, oldVal) {

            if (oldVal) {
              oldVal.forEach(function (val) {
                val.isSelected = false;
              });
            }

            scope.isAllSelected = false;
          });
        }
      }
    }

    function advancedFilterItem(){
      return {
        restrict: 'E',
        templateUrl: 'app/components/tradesscreen/advancedFilterItem.html',
        scope: {
          itemName: "@",
          itemLabel: "@",
          itemData: "=",
          itemDataType: "@"
        },
        link: function () {},
        controller: advancedFilterItemController,
        controllerAs: 'vm',
        bindToController: true
      }

      /** @ngInject */
      function advancedFilterItemController(){
        console.log(this);
      }
    }
})();
