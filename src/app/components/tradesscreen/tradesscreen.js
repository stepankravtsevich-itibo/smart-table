(function () {
  "use strict";

  angular.module('tradesscreen', [
    'ui.router', 'ui.bootstrap', 'smart-table'
  ])

  .config(routerConfig);

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

  /** @ngInject */
  function tradesScreenCtrl(){}
})();
