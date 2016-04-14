(function() {
  'use strict';

  angular
    .module('tradesscreen')
    .constant('APIHost', 'http://some-awesome-backand:3000/api')
    .factory('tradesScreenService', tradesScreenService)
    .factory('FiltersService', FiltersService);


    /** @ngInject */
    function tradesScreenService($log, $http, $resource, APIHost) {

      return {
        getListings: getListings
      };

      function getListings(params) {
        var pagination = params.pagination;
        var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
        var number = pagination.number || 10;  // Number of entries showed per page.


        var url = APIHost + '/listings?start='+ start +'&limit=' + number;

        if (params.sort.predicate){
          url = url + '&orderBy='+params.sort.predicate +'&reverse='+params.sort.reverse ;
        }

        return $http.get(url)
          .then(getListingsComplete)
          .catch(getListingsFailed);

        function getListingsComplete(response) {
          return response.data;
        }

        function getListingsFailed(error) {
          $log.error('XHR Failed for getListings.\n' + angular.toJson(error.data, true));
        }
      };
  }


  /** @ngInject */
  function FiltersService($resource, APIHost){
    return $resource(APIHost + '/filters/:name');
  }

})();
