'use client';

import { useEffect, useState } from 'react';
import CoverageScopeSelect from './CoverageScopeSelect';
import StateSelect from './StateSelect';
import DistrictSelect from './DistrictSelect';

const DEFAULT_VALUE = {
  enabled: false,
  scope: 'national',
  country: 'India',
};

export default function LocationSelector({ value, onChange, className = '' }) {
  const [scope, setScope] = useState(value?.scope || 'national');
  const [state, setState] = useState(value?.stateId ? {
    id: value.stateId,
    name: value.stateName,
    slug: value.stateSlug,
    nameHi: value.nameHi || '',
  } : null);
  const [district, setDistrict] = useState(value?.districtId ? {
    id: value.districtId,
    name: value.districtName,
    slug: value.districtSlug,
    nameHi: value.nameHi || '',
  } : null);

  useEffect(() => {
    if (value?.scope) {
      setScope(value.scope);
    }

    if (value?.stateId) {
      setState({
        id: value.stateId,
        name: value.stateName || '',
        slug: value.stateSlug || '',
        nameHi: value.nameHi || '',
      });
    } else {
      setState(null);
    }

    if (value?.districtId) {
      setDistrict({
        id: value.districtId,
        name: value.districtName || '',
        slug: value.districtSlug || '',
        nameHi: value.nameHi || '',
      });
    } else {
      setDistrict(null);
    }
  }, [value?.scope, value?.stateId, value?.stateName, value?.stateSlug, value?.districtId, value?.districtName, value?.districtSlug, value?.nameHi]);

  const handleScopeChange = (nextScope) => {
    setScope(nextScope);

    if (nextScope === 'national') {
      setState(null);
      setDistrict(null);
      onChange?.({ ...DEFAULT_VALUE, scope: 'national', country: 'India' });
      return;
    }

    if (nextScope === 'state') {
      setDistrict(null);
      onChange?.({
        enabled: true,
        scope: 'state',
        country: 'India',
      });
      return;
    }

    setDistrict(null);
    onChange?.({
      enabled: true,
      scope: 'district',
      country: 'India',
    });
  };

  const handleStateChange = (nextState) => {
    setState(nextState);
    setDistrict(null);

    if (!nextState) {
      onChange?.({ ...DEFAULT_VALUE, scope: 'national', country: 'India' });
      return;
    }

    if (scope === 'state') {
      onChange?.({
        enabled: true,
        scope: 'state',
        country: 'India',
        stateId: nextState.id,
        stateSlug: nextState.slug,
        stateName: nextState.name,
      });
      return;
    }

    onChange?.({
      enabled: true,
      scope: 'district',
      country: 'India',
      stateId: nextState.id,
      stateSlug: nextState.slug,
      stateName: nextState.name,
      districtId: '',
      districtSlug: '',
      districtName: '',
    });
  };

  const handleDistrictChange = (nextDistrict) => {
    setDistrict(nextDistrict);

    if (!nextDistrict) {
      onChange?.({
        enabled: true,
        scope: 'district',
        country: 'India',
        stateId: state?.id,
        stateSlug: state?.slug,
        stateName: state?.name,
        districtId: '',
        districtSlug: '',
        districtName: '',
      });
      return;
    }

    onChange?.({
      enabled: true,
      scope: 'district',
      country: 'India',
      stateId: state?.id,
      stateSlug: state?.slug,
      stateName: state?.name,
      districtId: nextDistrict.id,
      districtSlug: nextDistrict.slug,
      districtName: nextDistrict.name,
    });
  };

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <CoverageScopeSelect value={scope} onChange={handleScopeChange} />

      {(scope === 'state' || scope === 'district') && (
        <StateSelect value={state} onChange={handleStateChange} />
      )}

      {scope === 'district' && (
        <DistrictSelect state={state} value={district} onChange={handleDistrictChange} />
      )}
    </div>
  );
}
