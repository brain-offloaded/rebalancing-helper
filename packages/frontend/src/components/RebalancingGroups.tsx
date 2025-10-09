import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  useGetRebalancingGroupsQuery,
  useCreateRebalancingGroupMutation,
  useGetTagsQuery,
} from '../graphql/__generated__';
import { Button, ButtonGroup } from './ui/Button';
import { Card, CardHeader, CardTitle } from './ui/Card';
import { Form, Field, FieldLabel, TextInput } from './ui/FormControls';
import {
  Grid as LayoutGrid,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './ui/Layout';
import { RebalancingGroupManagementModal } from './RebalancingGroupManagementModal';

const FormGroup = Field;
const Label = FieldLabel;
const Input = TextInput;

const GroupCard = styled(Card)`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TagItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ $color }) => `${$color}20`};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TagColor = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
`;

interface RebalancingGroup {
  id: string;
  name: string;
  description: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export const RebalancingGroups: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagIds: [] as string[],
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const {
    data: groupsData,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useGetRebalancingGroupsQuery();
  const { data: tagsData, loading: tagsLoading } = useGetTagsQuery();
  const [createGroup, { loading: creatingGroup }] =
    useCreateRebalancingGroupMutation();

  const groups = useMemo(
    () => (groupsData?.rebalancingGroups ?? []) as RebalancingGroup[],
    [groupsData?.rebalancingGroups],
  );
  const availableTags = useMemo(
    () => (tagsData?.tags ?? []) as Tag[],
    [tagsData?.tags],
  );

  const handleTagToggle = useCallback((tagId: string) => {
    setFormData((previous) => ({
      ...previous,
      tagIds: previous.tagIds.includes(tagId)
        ? previous.tagIds.filter((id) => id !== tagId)
        : [...previous.tagIds, tagId],
    }));
  }, []);

  const handleCreateGroup = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (formData.name.trim().length === 0) {
        alert('그룹 이름을 입력하세요.');
        return;
      }

      try {
        await createGroup({
          variables: {
            input: {
              name: formData.name.trim(),
              description: formData.description.trim() || null,
              tagIds: formData.tagIds,
            },
          },
        });
        setFormData({ name: '', description: '', tagIds: [] });
        setShowForm(false);
        await refetchGroups();
      } catch (error) {
        console.error('리밸런싱 그룹 생성 실패:', error);
        alert('그룹을 생성하지 못했습니다. 다시 시도해주세요.');
      }
    },
    [createGroup, formData, refetchGroups],
  );

  const handleOpenManagement = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
  }, []);

  const handleCloseManagement = useCallback(() => {
    setSelectedGroupId(null);
    void refetchGroups();
  }, [refetchGroups]);

  return (
    <Section>
      <SectionHeader>
        <div>
          <SectionTitle>리밸런싱 그룹</SectionTitle>
          <SectionDescription>
            포트폴리오 리밸런싱을 위한 그룹을 생성하고 관리하세요.
          </SectionDescription>
        </div>
        <Button onClick={() => setShowForm((previous) => !previous)}>
          {showForm ? '그룹 생성 취소' : '새 그룹 만들기'}
        </Button>
      </SectionHeader>

      {showForm ? (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle>새 리밸런싱 그룹</CardTitle>
          </CardHeader>
          <Form onSubmit={handleCreateGroup}>
            <FormGroup>
              <Label htmlFor="group-name-input">그룹 이름</Label>
              <Input
                id="group-name-input"
                value={formData.name}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="group-description-input">설명</Label>
              <Input
                id="group-description-input"
                value={formData.description}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="그룹에 대한 설명을 입력하세요"
              />
            </FormGroup>
            <FormGroup>
              <Label>포함할 태그</Label>
              {tagsLoading ? (
                <p style={{ margin: 0 }}>태그 정보를 불러오는 중입니다...</p>
              ) : availableTags.length === 0 ? (
                <p style={{ margin: 0 }}>사용 가능한 태그가 없습니다.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {availableTags.map((tag) => (
                    <label
                      key={tag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.tagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                      />
                      <TagColor $color={tag.color} />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </FormGroup>
            <ButtonGroup>
              <Button type="submit" variant="primary" disabled={creatingGroup}>
                {creatingGroup ? '생성 중...' : '그룹 생성'}
              </Button>
              <Button type="button" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </ButtonGroup>
          </Form>
        </Card>
      ) : null}

      {groupsLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>그룹 정보를 불러오는 중입니다...</CardTitle>
          </CardHeader>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>등록된 리밸런싱 그룹이 없습니다.</CardTitle>
          </CardHeader>
          <p style={{ marginBottom: 0 }}>
            상단의 &lsquo;새 그룹 만들기&rsquo; 버튼을 눌러 첫 그룹을
            생성해보세요.
          </p>
        </Card>
      ) : (
        <LayoutGrid minWidth="320px">
          {groups.map((group) => (
            <GroupCard key={group.id}>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>{group.name}</h3>
                {group.description ? (
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    {group.description}
                  </p>
                ) : null}
              </div>
              <div>
                <strong>포함 태그:</strong>
                <TagList>
                  {group.tagIds.length === 0 ? (
                    <span style={{ color: '#6b7280' }}>
                      등록된 태그가 없습니다.
                    </span>
                  ) : (
                    group.tagIds.map((tagId) => {
                      const tag = availableTags.find(
                        (item) => item.id === tagId,
                      );
                      if (!tag) {
                        return null;
                      }
                      return (
                        <TagItem key={tag.id} $color={tag.color}>
                          <TagColor $color={tag.color} />
                          {tag.name}
                        </TagItem>
                      );
                    })
                  )}
                </TagList>
              </div>
              <div>
                <Button onClick={() => handleOpenManagement(group.id)}>
                  관리
                </Button>
              </div>
            </GroupCard>
          ))}
        </LayoutGrid>
      )}

      <RebalancingGroupManagementModal
        open={selectedGroupId !== null}
        groupId={selectedGroupId}
        onClose={handleCloseManagement}
      />
    </Section>
  );
};
