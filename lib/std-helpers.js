/* Здесь будут вспомагательные функции */


isAdmin=function(user){
  user = (typeof user === 'undefined') ? Meteor.user() : user;
  return !!user && !!user.isAdmin;
};

isAdminById=function(userId){
  var user = Meteor.users.findOne(userId);
  return !!(user && isAdmin(user));
};

formatNumber = function(format, number) {
  var formattedNumber,
      indexFormat,
      indexNumber,
      lastCharacter;

  formattedNumber = '';
  number = String(number).replace(/\D/g, '');

  for (indexFormat = 0, indexNumber = 0; indexFormat < format.length; indexFormat = indexFormat + 1) {
    if (/\d/g.test(format.charAt(indexFormat))) {
      if (format.charAt(indexFormat) === number.charAt(indexNumber)) {
        formattedNumber += number.charAt(indexNumber);
        indexNumber = indexNumber + 1;
      } else {
        formattedNumber += format.charAt(indexFormat);
      }
    } else if (format.charAt(indexFormat) !== 'd') {
      if (number.charAt(indexNumber) !== '' || format.charAt(indexFormat) === '+') {
        formattedNumber += format.charAt(indexFormat);
      }
    } else {
      if (number.charAt(indexNumber) === '') {
        formattedNumber += '';
      } else {
        formattedNumber += number.charAt(indexNumber);
        indexNumber = indexNumber + 1;
      }
    }
  }
  
  lastCharacter = format.charAt(formattedNumber.length);
  if (lastCharacter !== 'd') {
    formattedNumber += lastCharacter;
  }

  return formattedNumber;
};

formatPhone=function(phone) {
  // если телефон на 3 нач. значит укр формат
  if (phone.substr(0, 1) == 3) {
    return formatNumber("+d (dddd) dd-ddd-ddd", phone);
  } else {
    return formatNumber("+d (ddd) ddd-dd-ddd", phone);
  }
};

// build regexp from pattern
mkRegexp=function(pattern) {
  return pattern.replace(/\s+(\S)/g, '.+?$1').replace(/([()*])/g, '\\$1');
};
