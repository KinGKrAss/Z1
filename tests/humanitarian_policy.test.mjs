import test from "node:test";
import assert from "node:assert/strict";
import {PEACE_POLICY,evaluateHumanitarianAction,requireHumanitarianAction} from "../core/humanitarian_policy.mjs";
test("policy id",()=>assert.equal(PEACE_POLICY.id,"Z1-PEACE-001"));
test("blocks all prohibited categories",()=>{for(const a of ["weapon_control","target_selection","attack_planning","weapon_optimization","autonomous_use_of_force"])assert.equal(evaluateHumanitarianAction(a).allowed,false)});
test("allows humanitarian categories",()=>{for(const a of ["humanitarian_aid","civilian_protection","peace_mediation","neutral_analysis","education","disaster_response"])assert.equal(evaluateHumanitarianAction(a).allowed,true)});
test("fails closed on unknown or invalid actions",()=>{for(const a of ["other",null,{}, ""])assert.equal(evaluateHumanitarianAction(a).allowed,false)});
test("trusted enforcement refuses and audits",()=>{let log=[];assert.throws(()=>requireHumanitarianAction("weapon_control",x=>log.push(x)),/prohibited_weaponization/);assert.equal(log[0].allowed,false)});
