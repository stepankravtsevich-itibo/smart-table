(function() {
  'use strict';

  angular
    .module('tradesscreen')
    .directive('tradesGreed', tradesGreed)
    .directive('csSelect', csSelect)
    .directive('stSelectAll', stSelectAll);

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
})();
