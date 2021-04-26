/**
 *
 * @param {Query} 😎 The query object from the Model
 * @param {String} 😎 The query string that comes from the request
 * @returns {Qyery}
 */

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // get only the results with the value of the fields you specify
    const queryObj = {
      ...this.queryString,
    };
    const exludedFields = ["page", "sort", "limit", "fields"];
    exludedFields.forEach((el) => delete queryObj[el]);

    // 1A) FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`));

    this.query = this.query.find(queryStr);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" "); // when we have a tie in results you specify a second field to sort by that field the tied results
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    // limits the results sent to client to only the specified fields
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      // the operation of selecting only certain fields name is called projecting
      this.query = this.query.select(fields);
    }
    // else {
    //   // default sduam ti dergojme ate fushen __v qe krijon mongoose sduam as ta caktivizojme se mongoose e perdor internally ate.
    //   // duke i vendosu - perpara quhet exluding , pra duam cdo gje pervec kesaj fushe. Ndersa ajo me siper quhet including
    //   // this.query = this.query.select("-__v");
    // }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
