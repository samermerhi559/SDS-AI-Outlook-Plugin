import React, { memo } from "react";
import { components } from "react-select";

const CustomSingleValue = memo((props: any) => (
  <components.SingleValue {...props}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src={props.data.flag}
        alt={props.data.label}
        style={{ width: "20px", height: "15px", marginRight: "10px" }}
      />
      {props.data.label}
    </div>
  </components.SingleValue>
));

const CustomOption = memo((props: any) => (
  <components.Option {...props}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src={props.data.flag}
        alt={props.data.label}
        style={{ width: "20px", height: "15px", marginRight: "10px" }}
      />
      {props.data.label}
    </div>
  </components.Option>
));

export { CustomSingleValue, CustomOption };