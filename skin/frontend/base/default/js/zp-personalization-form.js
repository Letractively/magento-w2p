function personalization_form ($) {
  var zp = this;

  function scroll_strip(panel) {
    if ($(panel).hasClass('images-scroller')) {
      $(panel).scrollLeft(0);
      var position = $('input:checked', panel).parents('td').position();
      if (position)
        $(panel).scrollLeft(position.left);
    }
    return true;
  }

  zp.scroll_strip = scroll_strip;

  function show_image_edit_dialog (image_name, src, $thumb) {
    var image_name = unescape(image_name);

    $.fancybox({
      'padding': 0,
      'titleShow': false,
      'type': 'ajax',
      'href': src,
      'hideOnOverlayClick': false,
      'hideOnContentClick': false,
      'centerOnScroll': false,
      'showNavArrows': false,
      'onComplete': function () {
        zp.image_edit = {
          'url': {
            'image': zp.url.image,
            'user_image_template': zp.url['user-image-template'] },
          '$selected_thumbnail': $thumb,
           //!!! Temp solution
          '$input': $thumb.parents().children('input.zetaprints-images'),
          'image_id': $thumb.attr('id'),
          'page': {
            'width_in': zp.template_details.pages[zp.current_page]['width-in'],
            'height_in': zp.template_details.pages[zp.current_page]['height-in']
          },
          'placeholder': zp.template_details.pages[zp.current_page]
                                                          .images[image_name],
          'shape': zp.template_details.pages[zp.current_page]
                                                          .shapes[image_name],
          'options': zp.options['image-edit']
                       ?  zp.options['image-edit'] : {} };

        zetaprint_image_editor.apply(zp.image_edit, [$]);
      },

      'onClosed': function () {
        var $input = zp.image_edit.$input;

        if (!$input.length)
          return;

        var metadata = $input.data('metadata');

        if (metadata) {
          metadata['img-id'] = $input.attr('value');

          zp_set_metadata(zp.image_edit.placeholder, metadata);
        } else
          zp_clear_metadata(zp.image_edit.placeholder);
      } });
  }

  function export_previews_to_string (template_details) {
    var previews = '';

    for (page_number in template_details.pages)
      if (template_details.pages[page_number]['updated-preview-image'])
        previews += ','
            + template_details.pages[page_number]['updated-preview-image'];

    return previews.substring(1);
  }

  function add_fake_add_to_cart_button ($original_button,
                                        is_multipage_template) {

    var title = $original_button.attr('title')

    if (is_multipage_template)
      var notice = window.notice_to_update_preview_text_for_multipage_template;
    else
      var notice = window.notice_to_update_preview_text;

    var $fake_button_with_notice = $(
        '<button id="zetaprints-fake-add-to-cart-button"' +
                'class="button disable" type="button"' +
                'title="' + title + '">' +
          '<span><span>' + title + '</span></span>' +
        '</button>' +
        '<span id="zetaprints-fake-add-to-cart-warning"' +
              'class="zetaprints-notice to-update-preview">' +
          notice +
        '</span>' );

    $original_button.addClass('no-display').after($fake_button_with_notice);
  }

  function remove_fake_add_to_cart_button ($original_button) {
    $('#zetaprints-fake-add-to-cart-button, ' +
      '#zetaprints-fake-add-to-cart-warning').remove();
    $original_button.removeClass('no-display');
  }

  var product_image_box = $('#zetaprints-preview-image-container').css('position', 'relative')[0];
  var product_image_element = $('#image').parent()[0];
  var has_image_zoomer = $(product_image_element).hasClass('product-image-zoom');

  var $add_to_cart_button = $('#zetaprints-add-to-cart-button');

  //If base image is not set
  if (!has_image_zoomer)
    //then remove all original images placed by M.
    $(product_image_element).empty();

  //and it's personalization step (for 2-step theme)
  if (this.is_personalization_step) {
    //remove zoomer and base image
    $(product_image_element).removeClass('product-image-zoom');
    $('#image, #track_hint, div.zoom').remove();
    has_image_zoomer = false;
  }

  //Add placeholders with spinners for preview images to the product page
  for (var page_number in this.template_details.pages)
    $('<div id="zp-placeholder-for-preview-' + page_number +
      '" class="zetaprints-preview-placeholder zp-hidden"><div class=' +
      '"zetaprints-big-spinner" /></div>').appendTo(product_image_element);

  //If no image zoomer on the page
  if (!has_image_zoomer)
    //then show placeholder and spinner for the first page
    $('#zp-placeholder-for-preview-1').removeClass('zp-hidden');

  //Set current template page to the first (1-based index)
  this.current_page = 1;

  //Add TemplateID parameter to the form
  $('<input type="hidden" name="zetaprints-TemplateID" value="' +
    this.template_details.guid +'" />').appendTo('#product_addtocart_form');

  //If update_first_preview_on_load parameter was set
  if (this.update_first_preview_on_load) {
    //Add over-image spinner for the first preview
    $('<div id="zetaprints-first-preview-update-spinner" class="' +
      'zetaprints-big-spinner zetaprints-over-image-spinner zp-hidden" />')
      .appendTo(product_image_box);

    //Update preview for the first page
    update_preview({ data: { zp: this } }, true);
  }

  //Add previews to the product page
  for (var page_number in this.template_details.pages) {
    if (this.previews_from_session)
      var url
            = this.template_details.pages[page_number]['updated-preview-image'];
    else
      var url = this.template_details.pages[page_number]['preview-image'];

    var zp = this;

    $('<a id="preview-image-page-' + page_number +
      '" class="zetaprints-template-preview zp-hidden" href="' + url +
      '"><img title="' + click_to_view_in_large_size + '" src="' + url +
      '" /></a>')
    .children()
    .bind('load', {page_number: page_number}, function (event) {

      //Hide notice about image loading
      $('div.zetaprints-preview-button span.text, ' +
          'div.zetaprints-preview-button img.ajax-loader')
            .css('display', 'none');

      //Hide placeholder and spinner after image has loaded
      $('#zp-placeholder-for-preview-' + event.data.page_number)
        .addClass('zp-hidden');

      //If no image zoomer on the page and image is for the first page
      //and first page was opened
      if (!has_image_zoomer && event.data.page_number == 1
          && zp.current_page == 1)
        //then show preview for the first page
        $('#preview-image-page-1').removeClass('zp-hidden');

      //If update_first_preview_on_load parameter was set and
      //first default preview has already been loaded then...
      if (zp.update_first_preview_on_load && event.data.page_number == 1)
        //...show over-image spinner
        $('div#zetaprints-first-preview-update-spinner')
          .removeClass('zp-hidden');
    }).end().appendTo(product_image_element);
  }

  $('div.zetaprints-page-stock-images input:checked').each(function() {
    if ($(this).attr('id') != 'zetaprints-blank-value')
      $(this).parents('div.zetaprints-images-selector').removeClass('no-value');
  });

  $('#stock-images-page-1, #input-fields-page-1').removeClass('zp-hidden');
  $('div.zetaprints-image-tabs, div.zetaprints-preview-button').css('display', 'block');

  $('div.zetaprints-image-tabs li:first').addClass('selected');

  $('div.tab.user-images').each(function() {
    var tab_button = $('ul.tab-buttons li.hidden', $(this).parents('div.selector-content'));

    if ($('td', this).length > 0)
      $(tab_button).removeClass('hidden');
  });

  //??? Do we need it anymore?
  this.changed_pages = new Array(this.template_details.pages_number + 1);

  if (!this.previews)
    this.previews = [];

  for (var number in this.template_details.pages)
    if (this.template_details.pages[number].static) {
      this.previews[number - 1] = this.template_details
                                    .pages[number]['preview-image']
                                    .split('/preview/')[1];

      this.changed_pages[number] = true;
    }

  //Create array for preview images sharing links
  if (window.place_preview_image_sharing_link)
    this.preview_sharing_links
                            = new Array(this.template_details.pages_number + 1);

   $('<input type="hidden" name="zetaprints-previews" value="' +
      export_previews_to_string(this.template_details) + '" />')
      .appendTo($('#product_addtocart_form'));

  if (this.previews_from_session)
    $('div.zetaprints-notice.to-update-preview').addClass('zp-hidden');
  else
    add_fake_add_to_cart_button($add_to_cart_button,
                                this.template_details.pages['2'] != undefined);

  //Add resizer for text inputs and text areas for the first page
  $('#input-fields-page-1 .input-text, #input-fields-page-1 textarea')
    .text_field_resizer();

  $('div.zetaprints-image-tabs li').click({zp: this}, function (event) {
    $('div.zetaprints-image-tabs li').removeClass('selected');

    //Hide preview image, preview placeholder with spinner, text fields
    //and image fields for the current page
    $('a.zetaprints-template-preview, div.zetaprints-page-stock-images, div.zetaprints-page-input-fields, div.zetaprints-preview-placeholder').addClass('zp-hidden');

    //Remove shapes for current page
    if (event.data.zp.has_shapes && window.remove_all_shapes)
      remove_all_shapes(product_image_box);

    $(this).addClass('selected');
    var page = $('img', this).attr('rel');

    //If there's image zoomer on the page
    if (has_image_zoomer) {
      //remove it and base image
      $(product_image_element).removeClass('product-image-zoom');
      $('#image, #track_hint, div.zoom').remove();
      has_image_zoomer = false;
    }

    //Show preview image, preview placeholder with spinner, text fields
    //and image fields for the selected page
    $('#preview-image-' + page + ', #stock-images-' + page + ', #input-fields-'
      + page + ', #zp-placeholder-for-preview-' + page).removeClass('zp-hidden');

    //Add resizer for text inputs and text areas for the selected page
    $('#input-fields-' + page + ' .input-text, ' +
      '#input-fields-' + page + ' textarea').text_field_resizer();

    //Remember number of selected page
    event.data.zp.current_page = page.split('-')[1] * 1;

    //Check if page is static then...
    if (event.data.zp.template_details.pages[event.data.zp.current_page].static)
      //... hide Update preview button
      $('button.update-preview').addClass('zp-hidden');
    else
      //... otherwise show it
      $('button.update-preview').removeClass('zp-hidden');

    //Set preview images sharing link for the current page
    if (window.place_preview_image_sharing_link)
      set_preview_sharing_link_for_page(event.data.zp.current_page,
                                        event.data.zp.preview_sharing_links);

    //Add shapes for selected page
    if (event.data.zp.has_shapes
        && window.place_all_shapes_for_page
        && window.shape_handler)
      place_all_shapes_for_page(event.data.zp.template_details.pages[event.data.zp.current_page].shapes, product_image_box, shape_handler);

    if (event.data.zp.current_page < event.data.zp.template_details.pages_number
        && (event.data.zp.template_details.pages[event.data.zp.current_page].static
            || event.data.zp.changed_pages[event.data.zp.current_page]))
      $('div.zetaprints-next-page-button').show();
    else
      $('div.zetaprints-next-page-button').hide();
  });

  function add_preview_sharing_link_for_page (page_number, links, filename) {
    links[page_number] = preview_image_sharing_link_template + filename;

    $('span.zetaprints-share-link').removeClass('empty');
    $('#zetaprints-share-link-input').val(links[page_number]);
  }

  function set_preview_sharing_link_for_page (page_number, links) {
    if (links[page_number]) {
      $('span.zetaprints-share-link').removeClass('empty');
      $('#zetaprints-share-link-input').val(links[page_number]);
    } else {
      $('span.zetaprints-share-link').addClass('empty');
      $('#zetaprints-share-link-input').val('');
    }
  }

  function prepare_string_for_php (s) {
    return s.replace(/\./g, '\x0A');
  }

  function prepare_post_data_for_php (data) {
    var _data = '';

    data = data.split('&');
    for (var i = 0; i < data.length; i++) {
      var token = data[i].split('=');
      _data += '&' + prepare_string_for_php(token[0]) + '=' + token[1];
    }

    return _data.substring(1);
  }

  function prepare_metadata_from_page (page) {
    var metadata = '';

    for (name in page.images) {
      var field_metadata = zp_convert_metadata_to_string(page.images[name]);

      if (!field_metadata)
        continue;

      metadata += '&zetaprints-*#' + prepare_string_for_php(name) + '='
                  + field_metadata + '&';
    }

    for (var name in page.fields) {
      var field_metadata = zp_convert_metadata_to_string(page.fields[name]);

      if (!field_metadata)
        continue;

      metadata += '&zetaprints-*_' + prepare_string_for_php(name) + '='
                  + field_metadata + '&';
    }

    return metadata;
  }

  function update_preview (event, preserve_fields) {
    $('div.zetaprints-preview-button span.text, ' +
      'div.zetaprints-preview-button img.ajax-loader').css('display', 'inline');

    var update_preview_button = $('button.update-preview').hide();

    $('div.zetaprints-page-input-fields input,' +
      'div.zetaprints-page-input-fields textarea').each(function () {

      $(this).text_field_editor('hide');
    });

    //Convert preserve_field parameter to query parameter
    var preserve_fields = typeof(preserve_fields) != 'undefined'
      && preserve_fields ? '&zetaprints-Preserve=yes' : preserve_fields = '';

    var zp = event.data.zp;

    //!!! Workaround
    //Remember page number
    var current_page = zp.current_page;

    var metadata =
         prepare_metadata_from_page(zp.template_details.pages[zp.current_page]);

    $.ajax({
      url: zp.url.preview,
      type: 'POST',
      dataType: 'json',
      data: prepare_post_data_for_php($('#product_addtocart_form').serialize())
        + '&zetaprints-From=' + current_page + preserve_fields + metadata,
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        $('div.zetaprints-preview-button span.text, img.ajax-loader').css('display', 'none');
        $(update_preview_button).show();
        alert(preview_generation_response_error_text + textStatus); },
      success: function (data, textStatus) {
        if (!data) {
          alert(preview_generation_error_text);
        } else {
          //!!! Make code in function to not depend on current page number
          //!!! (it's broken way to update preview, user can switch to another
          //!!! page while updating preview)
          //!!! Go throw template details and update previews which has updated
          //!!! preview images (updated-preview-image field)

          //!!! Use updated-preview-image and updated-thumb-image instead
          //!!! updated-preview-url and updated-preview-url
          //!!! Make urls in controller
          //Update links to preview image on current page
          $('#preview-image-page-' + current_page).attr('href',
                              data.pages[current_page]['updated-preview-url']);
          $('#preview-image-page-' + current_page + ' img').attr('src',
                              data.pages[current_page]['updated-preview-url']);

          var preview_filename = data.pages[current_page]['updated-preview-url']
                                   .split('/preview/')[1];

          //Generate preview sharing link if it was enabled
          if (window.place_preview_image_sharing_link)
            add_preview_sharing_link_for_page(current_page,
                                    zp.preview_sharing_links, preview_filename);

          //Update link to preview image in opened fancybox
          var fancy_img = $('#fancybox-img');
          if (fancy_img.length)
            $(fancy_img).attr('src',
                              data.pages[current_page]['updated-preview-url']);

          if (!zp.previews)
            zp.previews = [];

          //Remember file name of preview image for current page
          zp.previews[current_page - 1] = preview_filename;

          //Update link to preview thumbnail for current page tab
          $('div.zetaprints-image-tabs img[rel="page-' + current_page + '"]')
            .attr('src', data.pages[current_page]['updated-thumb-url']);

          //If there's image zoomer on the page
          if (has_image_zoomer) {
            //remove it and base image
            $(product_image_element).removeClass('product-image-zoom');
            $('#image, #track_hint, div.zoom').remove();
            has_image_zoomer = false;
            //and show preview image for the current page
            $('#preview-image-page-' + current_page).removeClass('zp-hidden');

            //Add all shapes to personalization form after first preview
            //update
            if (zp.has_shapes && window.place_all_shapes_for_page
                && window.shape_handler)
              place_all_shapes_for_page(zp.template_details.pages[zp.current_page].shapes,
                                        product_image_box,
                                        shape_handler);
          }

          if (zp.previews.length == zp.template_details.pages_number) {
            $('input[name="zetaprints-previews"]')
              .val(zp.previews.join(','));

            $('div.zetaprints-notice.to-update-preview').addClass('zp-hidden');
            remove_fake_add_to_cart_button($add_to_cart_button);
            $('div.save-order span').css('display', 'none');
          }
        }

        zp.changed_pages[current_page] = true;

        if (current_page < zp.template_details.pages_number)
          $('div.zetaprints-next-page-button').show();
        else
          $('div.zetaprints-next-page-button').hide();

        //If update_first_preview_on_load parameter was set then...
        if (zp.update_first_preview_on_load)
          //.. remove over-image spinner
          $('div#zetaprints-first-preview-update-spinner').remove();

        $(update_preview_button).show(); }
    });

    return false;
  }

  $('button.update-preview').click({zp: this}, update_preview);

  var upload_controller_url = this.url.upload;
  var image_controller_url = this.url.image;

  $('div.button.choose-file').each(function () {
    var uploader = new AjaxUpload(this, {
      name: 'customer-image',
      action: upload_controller_url,
      autoSubmit: true,
      onChange: function (file, extension) {
        var upload_div = $(this._button).parents('div.upload');
        $('input.file-name', upload_div).val(file);
      },
      onSubmit: function (file, extension) {
        var upload_div = $(this._button).parents('div.upload');
        $('div.button.choose-file', upload_div).addClass('disabled');
        $('div.button.cancel-upload', upload_div).removeClass('disabled');
        $('img.ajax-loader', upload_div).show();

        this.disable();
      },
      onComplete: function (file, response) {
        this.enable();

        var upload_div = $(this._button).parents('div.upload');
        $('div.button.choose-file', upload_div).removeClass('disabled');
        $('div.button.cancel-upload', upload_div).addClass('disabled');
        $('input.file-name', upload_div).val('');

        if (response == 'Error') {
          $('img.ajax-loader', upload_div).hide();
          alert(uploading_image_error_text);
          return;
        }

        var upload_field_id = $(upload_div).parents('div.selector-content').attr('id');

        response = response.split(';');

        var trs = $('div.zetaprints-page-stock-images div.tab.user-images table tr');

        var number_of_loaded_imgs = 0;

        $(trs).each(function () {
          var image_name = $('input[name="parameter"]', $(this).parents('div.user-images')).val();

          var td = $(
            '<td>\
              <input type="radio" name="zetaprints-#' + image_name + '" value="'
                + response[0] + '" class="zetaprints-images" />\
              <a class="edit-dialog" href="' + response[1] + 'target="_blank"\
                title="' + click_to_edit_text + '">\
                <img id="' + response[0] + '" src="' + response[2] + '" />\
                <div class="buttons-row">\
                  <div class="button delete" title="' + click_to_delete_text
                    + '" rel="' + response[0] +'">' + delete_button_text +
                  '</div>\
                  <div class="button edit" title="' + click_to_edit_text +
                    '" rel="' + response[0] +'">' + edit_button_text +
                  '</div>\
                </div>\
              </a>\
            </td>').prependTo(this);

          $('input:radio', td).change({ zp: zp }, image_field_select_handler);

          var tr = this;

          $('img', td).load(function() {

            //If a field the image was uploaded into is not current image field
            if ($(this).parents('div.selector-content').attr('id') != upload_field_id) {
              var scroll = $(td).parents('div.images-scroller');

              //Scroll stripper to save position of visible images
              $(scroll).scrollLeft($(scroll).scrollLeft() + $(td).outerWidth());
            }

            var img = this;

            $('a.edit-dialog, div.button.edit', tr).click(function () {
              var $link = $(this);

              //If customer clicks on Edit button then...
              if (this.tagName == 'DIV')
                //... get link to the image edit dialog and use its attributes
                var $link = $(this).parents('td').children('a');

              show_image_edit_dialog(image_name,
                                     $link.attr('href'),
                                     $link.find('img') );

              return false;
            });

            $('.button.delete', td).click(function() {
              if (confirm(delete_this_image_text)) {
                var imageId = $(this).attr('rel');

                $.ajax({
                  url: zp.url.image,
                  type: 'POST',
                  data: 'zetaprints-action=img-delete&zetaprints-ImageID='+imageId,
                  error: function (XMLHttpRequest, textStatus, errorThrown) {
                    alert(cant_delete_text + ': ' + textStatus);
                  },
                  success: function (data, textStatus) {
                    $('input[value="'+imageId+'"]').parent().remove();
                  }
                });
              }

              return false;
            });

            if (++number_of_loaded_imgs == trs.length) {
              $('div.tab.user-images input[value="' + response[0] + '"]',
                $(upload_div).parent()).attr('checked', 1).change();

              $('img.ajax-loader', upload_div).hide();
              $('div.zetaprints-page-stock-images ul.tab-buttons li.hidden')
                .removeClass('hidden');
              $(upload_div).parents('div.selector-content').tabs('select', 1);
            }
          });
        });
      }
    });

    $('div.button.cancel-upload', $(this).parent()).click(function () {
      if (!$(this).hasClass('disabled')) {
        uploader.cancel();
        uploader.enable();

        var upload_div = $(uploader._button).parents('div.upload');

        $('img.ajax-loader', upload_div).hide();
        $('div.button.choose-file', upload_div).removeClass('disabled');
        $('div.button.cancel-upload', upload_div).addClass('disabled');
        $('input.file-name', upload_div).val('');
      }
    });
  })

  function image_field_select_handler (event) {
    var $selector = $(event.target).parents('div.zetaprints-images-selector');
    var $content = $selector.parents('.selector-content');

    if (!$selector.get(0)) {
      $content =  $(event.target).parents('.selector-content');
      $selector = $content.data('in-preview-edit').parent;
    }

    $selector.removeClass('no-value');

    //If ZetaPrints advanced theme is enabled then...
    if (window.mark_shape_as_edited && window.unmark_shape_as_edited
        && window.mark_fieldbox_as_edited && window.unmark_fieldbox_as_edited) {
      var zp = event.data.zp;

      if ($(event.target).val().length)
        //... mark shape as edited then image is seleсted
        mark_shape_as_edited(zp.template_details.pages[zp.current_page]
                           .shapes[$(event.target).attr('name').substring(12)]);
      else
        //or unmark shape then Leave blank is selected
        unmark_shape_as_edited(zp.template_details.pages[zp.current_page]
                           .shapes[$(event.target).attr('name').substring(12)]);

      //Check that the value of a field was changed...
      if ($(event.target).val() != $content.data('original-value'))
        //... then mark a field box as edited
        mark_fieldbox_as_edited($(event.target).attr('name').substring(12));
      else
        //... else unmark the field box as edited
        unmark_fieldbox_as_edited($(event.target).attr('name').substring(12));
    }
  }

  zp.show_user_images = function ($panel)  {
    if ($panel.find('input.zetaprints-images').length > 0)
      $panel.tabs('select', 1);
  }

  zp.show_colorpicker = function ($panel) {
    if ($panel.hasClass('color-picker')
        && !$panel.find('input').attr('checked'))
      $panel.find('.color-sample').click();
  }

  $(window).load({ zp: this }, function (event) {
    var zp = event.data.zp;

    if (zp.has_shapes && window.mark_shapes_as_edited
        && window.precalculate_shapes
        && window.place_all_shapes_for_page && shape_handler) {

      mark_shapes_as_edited(zp.template_details);
      precalculate_shapes(zp.template_details);

      //Add all shapes only then there's no base image.
      //Shapes will be added after first preview update then base image exists
      if (!has_image_zoomer)
        place_all_shapes_for_page(zp.template_details.pages[zp.current_page].shapes,
                                  product_image_box,
                                  shape_handler);
    }

    $('div.zetaprints-images-selector').each(function () {
      var top_element = this;

      var tab_number = 0
      if ($('li.hidden', this).length == 0)
        tab_number = 1;

      var tabs = $('div.selector-content', this).tabs({
        selected: tab_number,
        show: function (event, ui) {
          zp.show_colorpicker($(ui.panel));
          scroll_strip(ui.panel);
        }
      });

      $('input', this).change({ zp: zp }, image_field_select_handler);

      $('div.head', this).click(function () {
        if ($(top_element).hasClass('minimized')) {
          $(top_element).removeClass('minimized');
          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));

          zp.show_colorpicker(panel);
          scroll_strip(panel)
        }
        else
          $(top_element).addClass('minimized').removeClass('expanded').css('width', '100%');

        return false;
      });

      var previews_images = $('div.product-img-box');

      $('a.image.collapse-expand', this).click(function () {
        if ($(top_element).hasClass('expanded')) {
          $(top_element).removeClass('expanded').css('width', '100%');
          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));
        } else {
          var position = $(top_element).position().left - $(previews_images).position().left;
          $(top_element).addClass('expanded')
            .css({ 'left': -position, 'width': position + $(top_element).outerWidth() })
            .removeClass('minimized');

          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));
          zp.show_colorpicker(panel);
        }
        scroll_strip(panel);
        return false;
      });

      var input = $('div.color-picker input', this)[0];
      var color_sample = $('div.color-sample', this);

      var colour = $(input).val();
      if (colour)
        $(color_sample).css('backgroundColor', colour);

      $([color_sample, $('div.color-picker a', this)]).ColorPicker({
        color: '#804080',
        onBeforeShow: function (colpkr) {
          var colour = $(input).val();
          if (colour)
            $(this).ColorPickerSetColor(colour);

          $(colpkr).draggable();
          return false;
        },
        onShow: function (colpkr) {
          $(colpkr).fadeIn(500);
          return false;
        },
        onHide: function (colpkr) {
          $(colpkr).fadeOut(500);
          return false;
        },
        onSubmit: function (hsb, hex, rgb, el) {
          $(top_element).removeClass('no-value');
          $(color_sample).css('backgroundColor', '#' + hex);

          $(input)
            .attr('disabled', 0)
            .val('#' + hex)
            .change()
            .attr('checked', 1);

          $(el).ColorPickerHide();
        }
      });
    });
  });

  $('div.zetaprints-next-page-button').click({zp: this}, function (event) {
    var next_page_number = event.data.zp.current_page + 1;

    $('div.zetaprints-image-tabs li img[rel="page-' + next_page_number +'"]')
      .parent()
      .click();

    return false;
  });

  $('a.zetaprints-template-preview').fancybox({
    'opacity': true,
    'overlayShow': false,
    'transitionIn': 'elastic',
    'speedIn': 500,
    'speedOut' : 500,
    'titleShow': false,
    'hideOnContentClick': true,
    'showNavArrows': false,
    'onComplete': function () {
      $('img#fancybox-img').attr('title', click_to_close_text);

      if (window.fancybox_resizing_add)
        fancybox_resizing_add(this);

      if (!(zp.has_shapes && window.place_all_shapes_for_page
        && window.highlight_shape_by_name && window.popup_field_by_name
        && window.fancy_shape_handler))
        return;

      var fancy_inner = $('div#fancybox-content')[0];

      place_all_shapes_for_page(zp.template_details.pages[zp.current_page].shapes,
                                fancy_inner, fancy_shape_handler);

      var $current_shape = jQuery('#current-shape');

      if ($current_shape.length) {
        highlight_shape_by_name($current_shape.attr('rel'), fancy_inner);
        popup_field_by_name($current_shape.attr('rel'));
      }

      zp.current_field_name = null;
    },
    'onCleanup': function () {
      if (window.fancybox_resizing_hide)
        fancybox_resizing_hide();

      if (zp.has_shapes && window.popdown_field_by_name) {
        $('div.zetaprints-field-shape', $('div#fancybox-content')).removeClass('highlighted');
        popdown_field_by_name(undefined, true);
      }
    } });

  $('a.in-dialog').fancybox({
    'opacity': true,
    'overlayShow': false,
    'transitionIn': 'elastic',
    'changeSpeed': 200,
    'speedIn': 500,
    'speedOut' : 500,
    'titleShow': false });

  $('a.edit-dialog, div.button.edit').click(function() {
    var link = this;

    //If customer clicks on Edit button then...
    if (this.tagName == 'DIV')
      //... get link to the image edit dialog and use its attributes
      var link = $(this).parents('td').children('a');

    show_image_edit_dialog($(link).attr('name'),
                           $(link).attr('href'),
                           $(link).children('img') );

    return false; });

  $('div.zetaprints-page-input-fields input, div.zetaprints-page-input-fields textarea').each(function () {
    var $text_field = $(this);
    var $button_container = $text_field.parents('dl').children('dt');

    $text_field.text_field_editor({
      button_parent: $button_container,

      change: function (data) {
        var field = zp.template_details.pages[zp.current_page]
                                .fields[$text_field.attr('name').substring(12)];

        var metadata = {
          'col-f': data.color }

        zp_set_metadata(field, metadata);
      }
    });
  });

  $('div.zetaprints-page-input-fields input[title], div.zetaprints-page-input-fields textarea[title]').qtip({
    position: { corner: { target: 'bottomLeft' } },
        show: { delay: 1, solo: true, when: { event: 'focus' } },
        hide: { when: { event: 'unfocus' } }
  });

  $('div.zetaprints-page-stock-images select[title]').qtip({
    position: { corner: { target: 'topLeft' }, adjust: { y: -30 } },
        show: { delay: 1, solo: true, when: { event: 'focus' } },
        hide: { when: { event: 'unfocus' } }
  });

  $('div.zetaprints-page-input-fields input.input-text').keypress(function (event) {
    if (event.keyCode == 13)
      return false;
  });

  //If ZetaPrints advanced theme is enabled then...
  if (this.has_shapes && window.mark_shape_as_edited
      && window.unmark_shape_as_edited && window.mark_fieldbox_as_edited
      && window.unmark_fieldbox_as_edited) {
    $('div.zetaprints-page-input-fields :input').keyup({ zp: this }, function (event) {
      var zp = event.data.zp;

      if ($(this).val().length)
        // ... then mark shape as edited if input field was modified and is not empty
        mark_shape_as_edited(zp.template_details.pages[zp.current_page]
                                   .shapes[$(this).attr('name').substring(12)]);
      else
        // or unmark it if input field is empty
        unmark_shape_as_edited(zp.template_details.pages[zp.current_page]
                                   .shapes[$(this).attr('name').substring(12)]);

      //Check that the value of a field was changed...
      if ($(this).val() != $(this).data('original-value'))
        //... then mark a field box as edited
        mark_fieldbox_as_edited($(this).attr('name').substring(12));
      else
         //... else unmark the field box as edited
        unmark_fieldbox_as_edited($(this).attr('name').substring(12));
    });
  }

  $('.button.delete').click({ zp: this }, function(event) {
    if (confirm(delete_this_image_text)) {
      var imageId = $(this).attr('rel');

      $.ajax({
        url: event.data.zp.url.image,
        type: 'POST',
        data: 'zetaprints-action=img-delete&zetaprints-ImageID='+imageId,
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          alert(cant_delete_text + ': ' + textStatus);
        },
        success: function (data, textStatus) {
          $('input[value="'+imageId+'"]').parent().remove();
        }
      });
    }

    return false;
  });

  $('input.zetaprints-images').click({ zp : this }, function (event) {
    var $input = $(this);
    var field = event.data.zp.template_details
                  .pages[event.data.zp.current_page]
                  .images[$input.attr('name').substring(12)];

    var metadata = $input.data('metadata');

    if (metadata) {
      metadata['img-id'] = $input.attr('value');

      zp_set_metadata(field, metadata);
    } else
      zp_clear_metadata(field);
  });

  if (this.has_shapes && window.add_in_preview_edit_handlers)
    add_in_preview_edit_handlers();
}