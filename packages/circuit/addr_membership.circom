pragma circom 2.1.2;

include "./node_modules/spartan-ecdsa-circuits/eff_ecdsa_membership/addr_membership.circom";

component main { public[ root, Tx, Ty, Ux, Uy ]} = AddrMembership(15);