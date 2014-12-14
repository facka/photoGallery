function PhotoController($scope,$http) {
  
  $scope.newPhoto = {
    	title: "",
    	imageUrl: "",
    	price: 100
    };

  var getPhotos = function(success, error) {
  	return $http.get("/api/photos")
      .then(function (response) {
        console.log('Photos received!');
        success(response.data);
      }, 
      function(reason){
        console.log('Error getting photos.');  
        error(reason);
      });
  };

  var updatePhoto = function(photo, success, error) {
  	return $http.put("/api/photos", photo)
      .then(function (response) {
        console.log('Photo updated!');
        success(response.data);
      }, 
      function(reason){
        console.log('Error updating photo.');  
        error(reason);
      });
  };

  var uploadPhoto = function(photo, success, error) {
  	return $http.post("/api/photos", photo)
      .then(function (response) {
        console.log('Photo uploaded!');
        success(response.data);
      }, 
      function(reason){
        console.log('Error uploading photo.');  
        error(reason);
      });
  };

  var refresh = function() {
  	  Loading.show();
	  getPhotos(function(photos){
	  		$scope.photos = photos;
	  		Loading.hide();
	  	},
	  	function(error) {
	  		console.log(error);
	  });
  };

  refresh();

  $scope.formValid = function( ) {
  	if ($scope.photoBeingEdited) {
  		return $scope.photoBeingEdited.title && $scope.photoBeingEdited.price && angular.isNumber($scope.photoBeingEdited.price) && $scope.photoBeingEdited.price > 0;
  	}
  	return false;
  };

  $scope.edit = function(photo) {
    
    $scope.photoBeingEdited = {
    	id: photo.id,
    	title: photo.title,
    	imageUrl: photo.imageUrl,
    	itemMPID: photo.itemMPID,
    	price: photo.price
    };
  };
 	
  $scope.saveEdit = function() {
  		var onSuccess = function() {
  			console.log("Foto actualizada!");
  			refresh();
  		};

  		var onError = function(error) {
  			AlertUtils.showErrorAlert("Error al guardar Foto", error);
  			Loading.hide();
  		};
  		Loading.show();
    	updatePhoto($scope.photoBeingEdited, onSuccess, onError);
  };

  $scope.cancelEdit = function(id) {
  	$scope.photoBeingEdited = {
    	title: "",
    	imageUrl: "",
    	price: ""
    };

  };

  $scope.upload = function() {
  		var onSuccess = function() {
  			console.log("Foto subida!");
  			refresh();
  		};

  		var onError = function(error) {
  			AlertUtils.showErrorAlert("Error al subir Foto", error);
  			Loading.hide();
  		};
  		Loading.show();
    	uploadPhoto($scope.newPhoto, onSuccess, onError);
  };

  
}