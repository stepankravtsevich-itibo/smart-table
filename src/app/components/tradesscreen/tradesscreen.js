(function () {
  "use strict";

  angular.module('tradesscreen', [
    'ui.router', 'ui.bootstrap', 'smart-table'
  ])

  .config(routerConfig)
  .directive('tradesGreed', tradesGreed);

  /** @ngInject */
  function routerConfig($stateProvider) {
    $stateProvider
      .state('tradesscreen', {
        url: '/tradesscreen',
        templateUrl: 'app/components/tradesscreen/tradesscreen.html',
        controller: tradesScreenCtrl,
        controllerAs: 'vm'
      });
  }

  function tradesGreed() {
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/tradesscreen/tradesgreed.html',
      scope: {
          gridOptions: '='
      },
      controller: tradesGreedController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function tradesGreedController(tradesScreenService, $filter) {
      var self = this;
      this.itemsBuPage = 10;
      this.displayed = [];

      this.callServer = function (table_params){
        self.isLoading = true;

        if (table_params){
          tradesScreenService.getListings(table_params).then(
            function(result){
              self.table_columns = [];
              self.displayed = [];
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

  /** @ngInject */
  function tradesScreenCtrl(){}
})();
