class UserSpaceCreateDto {
  constructor({ location, space_name, memo }) {
    this.longitude = location?.longitude;
    this.latitude = location?.latitude;
    this.space_name = space_name;
    this.memo = memo || null;
  }
}

module.exports = { UserSpaceCreateDto };