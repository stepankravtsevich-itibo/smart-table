(function() {
  'use strict';

  angular
    .module('gridAndFilters')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
