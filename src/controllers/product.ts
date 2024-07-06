import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "src/cloud";
import ProductModel from "src/model/product";
import { UserDocument } from "src/model/user";
import categories from "src/utils/categories";
import { sendErrorRes } from "src/utils/helper";


const uploadImage = (filePath : string) : Promise<UploadApiResponse> => {
    return cloudUploader.upload(filePath,{
        width : 1280,
        height : 720,
        crop : 'fill'
    })
}
// -- 1 --
// add a product to the list
export const listNewProduct : RequestHandler = async (req,res) => {
    const {name,price,category,description,purchasingDate} = req.body;
    const newProduct = new ProductModel({
        owner : req.user.id,
        name,
        price,
        category,
        description,
        purchasingDate
    });
    
    const { images } = req.files
    // if is multiple images
    const isMultiple = Array.isArray(images);
    // we dont want that file number be a lot
    if(isMultiple && images.length > 5){
        return sendErrorRes(
            res,
            "Image File can not be more than 5!",
            422
        );
    }
    let invalidFileType = false;

    // if we have multiple images in else is for one image
    if(isMultiple){
        for(let img of images){
            if(!img.mimetype?.startsWith('image')){
                invalidFileType = true;
                break;
            }
        }
    }
    else {
        if(images){
            if(!images.mimetype?.startsWith('image')){
                invalidFileType = true;
            }
        }
    }

    if(invalidFileType){
        return sendErrorRes(res,"Invalid file type!",422);
    };

    // file upload
    if(isMultiple) {
        const uploadPromise = images.map((file) => {
            // this func will do the upload
            return uploadImage(file.filepath);
        });
        // w8 for all uploads to complete
        const uploadResult = await Promise.all(uploadPromise);
        // Add the image url and public ID to the product images field
        newProduct.images = uploadResult.map(({secure_url , public_id}) => {
            return {url : secure_url , id : public_id}
        })

        newProduct.thumbnail = newProduct.images[0].url;
    } else {
        if(images){
            const {secure_url,public_id} = await uploadImage(images.filepath);
            newProduct.images = [{url : secure_url , id : public_id}]
            newProduct.thumbnail = secure_url;
        }
    }

    await newProduct.save();
     
    res.status(201).json({messges : "Added new Product!"})
}
// -- 2 --
// update
export const updateProduct : RequestHandler = async (req,res) => {
    const productId = req.params.id;
    if (!isValidObjectId(productId)) {
        return sendErrorRes(res,"invalid product Id",422);
    }
    
    const {name,price,category,description,purchasingDate,thumbnail} = req.body;
    const product = await ProductModel.findOneAndUpdate ({_id : productId,owner : req.user.id},{
        name,
        price,
        category,
        description,
        purchasingDate,
        thumbnail
    },{
        new : true
    });

    if (!product) {
        return sendErrorRes(res,"Product Not found",404);
    }

    if (typeof thumbnail === "string") {
        product.thumbnail = thumbnail;
    }


    const { images } = req.files
    // if is multiple images
    const isMultiple = Array.isArray(images);
    // we dont want that file number be a lot
    const oldImages = product.images?.length || 0 ;
    if(oldImages > 5){
        return sendErrorRes(
            res,
            "Image File can not be more than 5!",
            422
        );
    }
    if(isMultiple){
        if((oldImages + images.length) > 5){
            return sendErrorRes(
                res,
                "Image File can not be more than 5!",
                422
            );
        }
    }

    let invalidFileType = false;

    // if we have multiple images in else is for one image
    if(isMultiple){
        for(let img of images){
            if(!img.mimetype?.startsWith('image')){
                invalidFileType = true;
                break;
            }
        }
    }
    else {
        if(images){
            if(!images.mimetype?.startsWith('image')){
                invalidFileType = true;
            }
        }
    }

    if(invalidFileType){
        return sendErrorRes(res,"Invalid file type!",422);
    };

    // file upload
    if(isMultiple) {
        const uploadPromise = images.map((file) => {
            // this func will do the upload
            return uploadImage(file.filepath);
        });
        // w8 for all uploads to complete
        const uploadResult = await Promise.all(uploadPromise);
        // Add the image url and public ID to the product images field
        const newImages = uploadResult.map(({secure_url , public_id}) => {
            return {url : secure_url , id : public_id}
        })

        if(product.images){
            product.images.push(...newImages)
        }else{
            product.images = newImages
        }

    } else {
        if(images){
            const {secure_url,public_id} = await uploadImage(images.filepath);

            if(product.images){
                product.images.push({url : secure_url , id : public_id})
            }else{
                product.images = [{url : secure_url , id : public_id}];
            }
        }
    }

    await product.save();
     
    res.status(200).json({messges : "Product updated seccusfully!"})
}
// -- 3 --
// delete
export const deleteProduct : RequestHandler = async (req,res) => {

    const productId = req.params.id;
    if (!isValidObjectId(productId)) {
        return sendErrorRes(res,"invalid product Id",422);
    }

    const product = await ProductModel.findOneAndDelete({_id : productId , owner : req.user.id});
    if (!product) {
        return sendErrorRes(res,"There is no such Product",404);
    }
    const images = product.images || [];
    if(images.length){
        const ids : string[] = images.map((img)=>{
            return img.id;
        })
        await cloudApi.delete_resources(ids);
    }
    res.status(200).json({messges : "Product got Deleted seccusfully!"});
}
// -- 4 --
// delete single image
export const deleteSingleImage : RequestHandler = async (req,res) => {

    const {productId,imageId} = req.params;

    if (!isValidObjectId(productId)) {
        return sendErrorRes(res,"invalid product Id",422);
    }

    const product = await ProductModel.findOneAndUpdate({_id : productId , owner : req.user.id},
    {
        $pull : {
            images : { id : imageId}
        }
    },
    {
        new : true
    }
    );
    console.log(product);
    
    if (!product) {
        return sendErrorRes(res,"There is no such Product",404);
    }
    // change thumbnail if it was removed
    if(product.thumbnail?.includes(imageId)){
        const images = product.images;
        if(images != undefined){
            if (images.length > 0) {
                console.log('yes');
                product.thumbnail = images[0].url;
                await product.save();
            }else{
                console.log('no');
                product.thumbnail = "";
                await product.save();
            }
        }
    }
    // removing from cloud storage
    const sts = await cloudUploader.destroy(imageId);
    console.log(sts);
    
    res.status(200).json({messges : "Product Image got Deleted seccusfully!"});
}
// -- 5 --
// get product
export const getProductDetail : RequestHandler = async (req,res) => {

    const {id} = req.params;
    if (!isValidObjectId(id)) {
        return sendErrorRes(res,"invalid product Id",422);
    }

    const product = await ProductModel.findById(id).populate<{owner : UserDocument}>('owner')

    if (!product) {
        return sendErrorRes(res,"There is no such Product",404);
    }

    res.json({product : {
        id : product._id,
        name : product.name,
        description : product.description,
        thumbnail : product.thumbnail,
        category : product.category,
        price : product.price,
        images : product.images?.map((img) => img.url),
        seller : {
            id : product.owner._id,
            name : product.owner.name,
            avatar : product.owner.avatar?.url
        }
    }})
}
// -- 5 --
// get product by gategory
export const getProductByCategory : RequestHandler = async (req,res) => {

    const {category} = req.params;
    const {pageNo="1",limit="10"} = req.query as {pageNo : string , limit : string};
    if (!categories.includes(category)) {
        return sendErrorRes(res,"invalid Category",422);
    }

    const product = await ProductModel.find({category})
    .sort("-createdAt")
    .skip(( +pageNo - 1) * + limit )
    .limit(+limit);

    if (!product) {
        return sendErrorRes(res,"there is no product by this vategory",404);
    }
    
    const listProduct = product.map((p)=>{
        return {
            id : p._id,
            name : p.name,
            thumbnail : p.thumbnail,
            category : p.category,
            price : p.price,
        }
    });

    res.json({products : listProduct});

}
// -- 6 --
export const getLatestProducts : RequestHandler = async (req,res) => {
    const product = await ProductModel.find()
    .sort("-createdAt")
    .limit(10);

    const listProduct = product.map((p)=>{
        return {
            id : p._id,
            name : p.name,
            thumbnail : p.thumbnail,
            category : p.category,
            price : p.price,
        }
    });

    res.json({products : listProduct});
}
// -- 7 --
// get product by gategory
export const getListing : RequestHandler = async (req,res) => {

    const {pageNo="1",limit="10"} = req.query as {pageNo : string , limit : string};
    const product = await ProductModel.find({owner : req.user.id})
    .sort("-createdAt")
    .skip(( +pageNo - 1) * + limit )
    .limit(+limit);

    const listProduct = product.map((p)=>{
        return {
            id : p._id,
            name : p.name,
            thumbnail : p.thumbnail,
            category : p.category,
            price : p.price,
            images : p.images?.map((img) => img.url),
            description : p.description,
            date : p.purchasingDate,
            seller : {
                id : req.user.id,
                name : req.user.name,
                avatar : req.user.avatar
            }
        }
    });

    res.json({products : listProduct});

}

