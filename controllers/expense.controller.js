import {Expense,ExpenseSplit} from "../models/expense.model.js";
import isEqual from 'lodash.isequal';
import { GroupMembers, Groups } from "../models/groups.model.js";

const createExpense = async (req, res) => {
  try {
      const {expenseDetails,splitAmong} = req.body;
      const group = await Groups.findById(expenseDetails.groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      const splitType = group.equal_type ? 'equal' : 'percentage';

      // const parsed = createExpenseSchema.safeParse(expenseDetails);
      // if (!parsed.success) {
      //   return res.status(400).json({ errors: parsed.error.errors });
      // }
      const userCreating = req.user._id; //will get userId from middleware
      if (!userCreating) {
        return res.status(401).json({ message: "Please login first." });
      }
      const newExpense = await Expense.create({...expenseDetails,createdBy:userCreating,splitType,splitAmong});

      const splits=[]
      if(splitType == 'equal'){
        const splitAmnt=(expenseDetails.amount)/splitAmong.length
        for(const userId of splitAmong){
          splits.push({
            expenseId:newExpense._id,
            userId,
            amount:splitAmnt,
            isPaid: expenseDetails.paidBy===userId,
            isOwed: expenseDetails.paidBy!==userId
          })
        }
      }else  if (splitType === 'percentage'){
        for(const entries of splitAmong){
          const splitAmnt=(expenseDetails.amount * entries.percentage)/100
          splits.push({
            expenseId:newExpense._id,
            userId:entries.userId,
            amount:splitAmnt,
            isPaid: expenseDetails.paidBy===entries.userId,
            isOwed: expenseDetails.paidBy!==entries.userId
          })
        }
      }
      await ExpenseSplit.insertMany(splits)
      res.status(201).json({ message: "success", expense: newExpense});
    } catch (err) {
      res.status(500).json({ message: "backend error", error: err.message });
    }
};

const getAllExpense = async (req,res) => {
  try {
      const groupId = req.query.groupId; 
      const expenses = await Expense.find({groupId}).populate("paidBy");
      res.status(201).json({ message: "success", expenses});
    } catch (err) {
      res.status(500).json({ message: "backend error", error: err.message });
    }
};

const deleteExpense = async (req,res) => {
  try {
      const expenseId = req.query.id; 
      const userId = req.user._id;
      const expense=await Expense.findById(expenseId)
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const checkAdmin = await GroupMembers.findOne({ userId, groupId:expense.groupId });
      if (!checkAdmin) {
        return res.status(403).json({ message: "You are not part of this group." });
      }
      if (!checkAdmin.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete." });
      }
      await Expense.deleteOne({_id:expenseId});
      await ExpenseSplit.deleteMany({expenseId})
      res.status(201).json({ message: "success"});
    } catch (err) {
      res.status(500).json({ message: "backend error", error: err.message });
    }
};

const updateExpense=async(req,res)=>{
  try {
      const expenseId = req.query.id; 
      const userUpdating = req.user._id;
      const {expenseDetails,splitAmong}=req.body;

      const oldExpense=await Expense.findById(expenseId);
      if(oldExpense.createdBy!=userUpdating){
        return res.status(403).json({ message: "Only the person who created can update." });
      }
      const BigChanges = !isEqual(splitAmong, oldExpense.splitAmong) || expenseDetails.amount !== oldExpense.amount;
      let expenseRes;
      if(BigChanges){
        expenseRes= await Expense.findByIdAndUpdate(expenseId,{...expenseDetails,splitAmong},{new: true,});
        await ExpenseSplit.deleteMany({expenseId:expenseRes._id})
        const splits=[]
        if(expenseRes.splitType == 'equal'){
          const splitAmnt=(expenseRes.amount)/splitAmong.lgength
          for(const userId of splitAmong){
            splits.push({
              expenseId:expenseRes._id,
              userId,
              amount:splitAmnt,
              isPaid: expenseRes.paidBy===userId,
              isOwed: expenseRes.paidBy!==userId
            })
          }
        }else  if (expenseRes.splitType === 'percentage'){
          for(const entries of splitAmong){
            const splitAmnt=(expenseRes.amount * entries.percentage)/100
            splits.push({
              expenseId:expenseRes._id,
              userId:entries.userId,
              amount:splitAmnt,
              isPaid: expenseRes.paidBy===entries.userId,
              isOwed: expenseRes.paidBy!==entries.userId
            })
          }
        }
        await ExpenseSplit.insertMany(splits)
      }
      else{
        expenseRes= await Expense.findByIdAndUpdate(expenseId,expenseDetails,{new: true,})
      }
      res.status(201).json({ message: "success", expense:expenseRes});
    } catch (err) {
      res.status(500).json({ message: "backend error", error: err.message });
    }
}


export {createExpense,getAllExpense,deleteExpense};
