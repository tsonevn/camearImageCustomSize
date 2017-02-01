import { EventData, Observable, fromObject } from "data/observable";
import { Page } from "ui/page";
import { View } from 'ui/core/view';
import { takePicture, requestPermissions } from "nativescript-camera";
import * as appModule from "application";
import * as imageSourceModule from "image-source";
import { Image } from "ui/image"
import { ImageAsset, ImageAssetOptions } from "image-asset"
import { isIOS, isAndroid } from "platform"
var application = require("application")

declare var UIImage: any;
declare var PHImageManager: any;
declare var PHImageRequestOptions: any;
declare var targetSize: any;
declare var CGSize: any;
declare var PHImageManager: any;
declare var contentMode: any;
declare var PHImageContentModeAspectFill: any;
declare var PHImageRequestOptionsResizeMode, PHImageRequestOptionsDeliveryModeHighQualityFormat;
declare var Environment: any;

declare var java: any;
declare var android: any;

import * as trace from "trace";
trace.addCategories(trace.categories.Debug);
trace.enable();


export function navigatingTo(args: EventData) {
    var page = <Page>args.object;
    let picturePath = null;

    page.bindingContext = fromObject({ cameraImage: picturePath, saveToGallery: true });
}

export function onRequestPermissionsTap(args: EventData) {
    requestPermissions();
}

export function onTakePictureTap(args: EventData) {
    let page = <Page>(<View>args.object).page;
    let saveToGallery = page.bindingContext.get("saveToGallery");
    takePicture({ width: 2048, height: 1536, keepAspectRatio: false, saveToGallery: saveToGallery }).
        then((imageAsset) => {
            console.log("image asset android")
            console.log(imageAsset.android);

            if (isAndroid) {


                var downsampleOptions = new android.graphics.BitmapFactory.Options();
                downsampleOptions.inSampleSize = getSampleSize(imageAsset.android, { maxWidth: 2048, maxHeight: 1536 });
                var bitmap = android.graphics.BitmapFactory.decodeFile(imageAsset.android, downsampleOptions);
                console.log("bitmap");
                console.log(bitmap);
                console.log("bitmap getWidth");
                console.log(bitmap.getWidth());
                console.log("bitmap getHeight");
                console.log(bitmap.getHeight());
                page.bindingContext.set("cameraImage", bitmap);
            }
            if (isIOS) {
                try {

                    let manager = PHImageManager.defaultManager()
                    let options = new PHImageRequestOptions();
                    options.resizeMode = PHImageRequestOptionsResizeMode.Exact;
                    options.deliveryMode = PHImageRequestOptionsDeliveryModeHighQualityFormat;
                    var img;
                    manager.requestImageForAssetTargetSizeContentModeOptionsResultHandler(imageAsset.ios, { width: 2048, height: 1536 }, PHImageContentModeAspectFill, options, function (result, info) {
                        console.log("Result: " + result + ", info: " + info);
                        img = result;
                        
                    });
                    page.bindingContext.set("cameraImage", img);
                    console.log(img)

                } catch (e) {
                    console.log("err: " + e);
                    console.log("stack: " + e.stack);
                }
            }
            
        },
        (err) => {
            console.log("Error -> " + err.message);
        });
}


function getSampleSize(uri, options?: { maxWidth: number, maxHeight: number }): number {
    var scale = 1;
    if (isAndroid) {
        var boundsOptions = new android.graphics.BitmapFactory.Options();
        boundsOptions.inJustDecodeBounds = true;
        android.graphics.BitmapFactory.decodeFile(uri, boundsOptions);

        // Find the correct scale value. It should be the power of 2.
        var outWidth = boundsOptions.outWidth;
        var outHeight = boundsOptions.outHeight;

        if (options) {

            var targetSize = options.maxWidth < options.maxHeight ? options.maxWidth : options.maxHeight;
            while (!(matchesSize(targetSize, outWidth) ||
                matchesSize(targetSize, outHeight))) {
                outWidth /= 2;
                outHeight /= 2;
                scale *= 2;
            }
        }
    }
    return scale;
}


function matchesSize(targetSize: number, actualSize: number): boolean {
    return targetSize && actualSize / 2 < targetSize;
}