(function() {
  'use strict';

  angular
    .module('tradesscreen')
    .factory('tradesScreenService', tradesScreenService);


    /** @ngInject */
    function tradesScreenService($log, $http) {
      var apiHost = 'http://some-awesome-backand:3000/api';

      return {
        getListings: getListings
      };

      function getListings(params) {

        var pagination = params.pagination;
        var start = params.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
        var number = params.number || 10;  // Number of entries showed per page.


        var url = apiHost + '/listings?start='+ start +'&limit=' + number;

        if (params.sort.predicate){
          console.log("sort params: %O", params.sort);
        }


        return $http.get(url)
          .then(getListingsComplete)
          .catch(getListingsFailed);

        function getListingsComplete(response) {
          console.log(response);
          return response.data;
        }

        function getListingsFailed(error) {
          $log.error('XHR Failed for getListings.\n' + angular.toJson(error.data, true));
        }
      };
  }
})();
