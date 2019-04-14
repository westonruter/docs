/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const {join, basename} = require('path');
const got = require('got');
const {project} = require('@lib/utils');

/**
 * Fetches the latest blog entries from amp.dev and stores them for
 * rendering blog teasers in Grow
 *
 * @return {undefined}
 */
async function importBlog() {
  // WordPress API endpoints to fetch data from
  const API = {
    POSTS: 'https://blog.amp.dev/wp-json/wp/v2/posts?per_page=5',
    CATEGORIES: 'https://blog.amp.dev/wp-json/wp/v2/categories?per_page=100',
    MEDIA: 'https://blog.amp.dev/wp-json/wp/v2/media?per_page=100&media_type=image',
  };
  // Path to the YAML file storing the posts for Grow
  const BLOG_DATA = project.absolute('pages/shared/data/blog.yaml');
  // Path to download potential post images to
  const IMAGE_DEST = project.absolute('pages/static/img/blog/');

  const data = {
    'posts': (await got(API.POSTS, {'json': true})).body,
    'categories': (await got(API.POSTS, {'json': true})).body,
    'media': (await got(API.MEDIA, {'json': true})).body,
  };


  function getCategory(apiPost) {
    let cat = data.categories.find((category) => {
      console.log(category.id);
      return category.id == apiPost.categories[0];
    });
    console.log(cat);
  }

  /**
   * Looks through the available media files and tries to one
   * matching a specific post
   *
   * @param  {Object} post
   * @return {String} The path to the downloaded image
   */
  async function findImage(apiPost) {
    const media = data.media.find((media) => {
      return media.post == apiPost.id;
    }) || {};

    if (media.media_details) {
      console.log('\n', 'searching for ', apiPost.id)
      console.log(media.media_details);
      const imageUrl = media.media_details.sizes.medium.source_url;
      const image = await got(imageUrl);

      const savePath = join(IMAGE_DEST, basename(imageUrl));
      fs.writeFile(savePath, image);
      return savePath.replace(IMAGE_DEST, '');
    }

    return '';
  }

  /**
   * Uses the fetched data to build a post object that can be used
   * by Grow
   *
   * @return {Object}
   */
  function buildPost(apiPost) {
    const post = {
      'title': apiPost.title.rendered,
    };

    const category = getCategory(apiPost);
    if (category) {
      post['category'] = category.name;
    }

    // const image = await findImage(apiPost);
    // if (image) {
    //   post['image'] = image;
    // }

    return post;
  }

  // Transform data in way that is suitable for Grow
  data.posts = data.posts.map(buildPost);
  console.log(data.posts);
};

exports.importBlog = importBlog;
