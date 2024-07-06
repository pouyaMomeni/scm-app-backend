import { Router } from "express";
import { deleteProduct,
        listNewProduct,
        updateProduct,
        deleteSingleImage,
        getProductDetail,
        getProductByCategory,
        getListing,
        getLatestProducts } from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validate";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter =  Router();

productRouter.post("/",isAuth,fileParser,validate(newProductSchema),listNewProduct);
productRouter.patch("/:id",isAuth,fileParser,validate(newProductSchema),updateProduct);
productRouter.delete("/:id",isAuth,deleteProduct);
productRouter.delete("/image/:productId/:imageId",isAuth,deleteSingleImage);
productRouter.get("/detail/:id",getProductDetail);
productRouter.get("/by-category/:category",getProductByCategory);
productRouter.get("/latest",getLatestProducts);
productRouter.get("/listing",isAuth,getListing);
export default productRouter;