/**
* Wraps jQuery.prettyKalturaConfig with a single object based config and support for custom
* entry, uiconf and wid ( partner )
* 
* @dependencies jQuery, jQuery.prettyKalturaConfig
*/
( function( kWidget ){ "use strict"
	// make sure kWidget is set: 
	if( !kWidget ){
		return ;
	}
	kWidget.getLocalFeatureConfig = function( embedOptions ){
		var localEmbedOptions = $.extend( true, {}, embedOptions );
		// Check for any kdoc-embed localStorage setting overrides
		var setKeys = [ 'wid', 'uiconf_id', 'entry_id' ];
		$.each( setKeys, function(inx, key){
			if( localEmbedOptions && localEmbedOptions[ key] && localStorage[ 'kdoc-embed-' + key ] ){
				localEmbedOptions[ key] = localStorage[ 'kdoc-embed-' + key ];
			}
		});
		
		// Do a special check for plugins with "ks" if we have a localStorage override. 
		if( localStorage[ 'kdoc-embed-ks' ] && localEmbedOptions && localEmbedOptions.flashvars ){
			$.each( localEmbedOptions.flashvars, function( pKey, pObj){
				if( pKey == 'ks' ){
					localEmbedOptions.flashvars[ pKey ] = localStorage[ 'kdoc-embed-ks' ];
				}
				if( $.isPlainObject( pObj ) ){
					$.each( pObj, function( pluginKey, pluginValue ){
						if( pluginKey == 'ks' ){
							localEmbedOptions.flashvars[ pKey ][pluginKey] = localStorage[ 'kdoc-embed-ks' ];
						}
					})
				}
			})
		}
		function getQueryParams(qs) {
			qs = qs.split("+").join(" ");
			var params = {}, tokens,
				re = /[?&]?([^=]+)=([^&]*)/g;
			while (tokens = re.exec(qs)) {
				params[decodeURIComponent(tokens[1])]
				= decodeURIComponent(tokens[2]);
			}
			return params;
		}
		var params = {};
		// check if we are in an iframe or top level page: 
		if( self == top ){
			params = getQueryParams( document.location.hash.substr(1) );
		} else {
			params = getQueryParams( top.document.location.hash.substr(1) );
		}
		// parse JSON 
		var urlOptions = {};
		if( params['config'] ){
			try{
				urlOptions = JSON.parse( params['config'] );
			} catch ( e ){
				if( console )
					console.warn( 'Error could not parse config: ' + e.message );
			}
		}
		if( !$.isEmptyObject( urlOptions ) ){
			$.extend( true, localEmbedOptions, urlOptions);
			// TODO warning on edit pages to remove local settings if they want to "login" 
			// XSS :: evil passes users a integration url, 
			// uses custom uiConf pointing to evil.com,
			// custom is logged in with their "ks" 
			// evil.com can now run actions with the clients ks. 

			// We never want to accept local login credentials + url based uiConf setting.  
			$.each( localEmbedOptions.flashvars, function( pKey, pObj){
				if( pKey == 'ks' ){
					delete( localEmbedOptions.flashvars[ pKey ] )
				}
				$.each( pObj, function( spKey, spObj ){
					if( spKey == 'ks' ){
						delete( localEmbedOptions.flashvars[ pKey ][spKey] )
					}
				})
			})
		}
		
		return localEmbedOptions;
	}
	kWidget.featureConfig = function( options ){
		var pageEmbed = $.extend( true, {}, options.embed );
		// set update method in local function so we can call it any time we re-render the player
		options.embed = kWidget.getLocalFeatureConfig( options.embed );
		
		// By convention we document the first plugin ontop ( prettyKalturaConfig initial design 
		// required passing a given pluginId. 
		var firstPluginId = null;
		$.each( options.embed.flashvars, function( pName, na ) {
			firstPluginId = pName;
			return false;
		})
		
		// display pretty config box:
		$('#' + options.featureConfigId ).prettyKalturaConfig(
				firstPluginId, 
				options.embed.flashvars, 
				function( updatedFlashvars ){
					// update flashvars:
					options.embed.flashvars = updatedFlashvars;
					// update player embed with any local settings:
					kWidget.embed( kWidget.getLocalFeatureConfig( options.embed ) );
				},
				true, // showSettingsTab
				pageEmbed // the base page embed settings ( used to generate "short" share urls ) 
		)
		// do the actual kWidget embed
		kWidget.embed( options.embed );
	}
	
})( window.kWidget );