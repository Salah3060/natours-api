class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = { ...queryString };
  }
  filter() {
    let queryObj = { ...this.queryString };
    const excludedQueries = ['page', 'sort', 'limit', 'fields'];
    excludedQueries.forEach((el) => delete queryObj[el]);
    ['gt', 'lt', 'ne'].forEach((el) => {
      queryObj = JSON.parse(JSON.stringify(queryObj).replaceAll(el, `$${el}`));
      console.log(queryObj);
    });
    this.query = this.query.find(queryObj);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.replaceAll(',', ' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    // fields
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.queryString.fields.replaceAll(',', ' '),
      );
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
