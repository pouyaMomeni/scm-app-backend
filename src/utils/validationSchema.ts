import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';
import categories from './categories';
import { parseISO } from 'date-fns';

const myEmailRegEx = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
const myPasswordRegX = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
yup.addMethod(yup.string, 'email', function validateEmail(message) {
    return this.matches(myEmailRegEx, {
      message,
      name: 'email',
      excludeEmptyString: true,
    });
});
// -- 2 -- // for valdiating password that can use into other method
const validatePass = {
  password: yup
  .string()
  .required('password is missing')
  .min(6,"your password is too short")
  .matches(myPasswordRegX,"Your password is too simple"),
}
//
export const newUserSchema = yup.object({
    name: yup.
    string()
    .required('Name is missing'),
    email: yup
    .string()
    .email('invalid email')
    .required('email is missing'),
    ...validatePass

})

// it use into other schema
// -- 1 --
const validateTokenAndId = {
  id: yup.
  string()
  .test({
    name : "valid-id",
    message : "invalid user Id",
    test : (value) => {
      return isValidObjectId(value)
    }
  }),
  token: yup
  .string()
  .required('token is missing'),
}


export const verifyTokenSchema = yup.object({
  ...validateTokenAndId
})

export const resetPassSchema = yup.object({
  ...validateTokenAndId,
  ...validatePass
})

export const newProductSchema = yup.object({
  name : yup.string().required("Dame is missing"),
  description : yup.string().required("Description is missing"),
  category : yup.string().oneOf(categories,"invalid Category").required("Category is missing"),
  price : yup.string().transform((value) => {
    if(isNaN(+value)){
      return ' ';
    } 
    else {
      return +value;
    } 
  }).required("Price is Missing"),
  purchasingDate : yup.string()
  .transform((value)=>{
    try {
      return parseISO(value);
    } catch (error) {
      return '';
    }
  })
  .required("Purchasing date is missing")
})